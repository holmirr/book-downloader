import { MyFetch } from "./network";
import * as cheerio from "cheerio";
import { InitInfo } from "./types";
import { saveImage, saveBookId } from "./supabase/server/storage";
import Pusher from "pusher";

// 電子書籍のurlを受け取り、その電子書籍のタイトルとIDを返す関数
export async function getTitleAndId(url: string) {
  try {
    const response = await fetch(url);
    // urlページのhtmlを取得
    const data = await response.text();
    // cheerioでhtmlを解析
    const $ = cheerio.load(data);
    // id属性が__NUXT_DATA__のscriptタグの中身をstringで取得し、jsonとして解析→initDataにリストとして格納
    const initData: any[] = JSON.parse($("script#__NUXT_DATA__").text());
    const detailIndex: number = initData.find(item => item && typeof item === "object" && Object.keys(item).includes("detail")).detail;

    // ここらへんはundefinedの可能性があるが、そうであった場合はどうせエラーなので、エラー前提でundefinedや?.のハンドリングはしない
    const title = initData[initData[detailIndex].title];
    const id = initData[initData[initData[initData[detailIndex].books][0]].id];

    return { title, id };
  } catch (error) {
    console.log("タイトルとID取得エラー");
    console.log(error);
    throw error;
  }
}

// idとm3のトークンを受け取り、timeleftやtotal_imagesを取得する関数
export async function getInit(id: string, token: string): Promise<InitInfo> {
  try {
    const response = await fetch(`https://api.m2plus.com/api/v1/book/${id}/trial/init`, {
      headers: {
        "Accept": "application/json, text/plain, */*",

        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh-TW;q=0.6,zh;q=0.5",
        "Origin": "https://www.m2plus.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        "Authorization": `Bearer ${token}`
      }
    });
    return await response.json() as InitInfo;

  } catch (error) {
    console.log("初期情報取得エラー");
    throw error;
  }
}

// 指定されたパラメーターを受け取り、電子書籍のダウンロードを開始する関数
// 戻り値はダウンロードが終了したページ番号
export async function getBook(
  { abortController, title, id, token, timeleft, maxPage, startPage = 1, pusher, downloadId }:
    {
      abortController: AbortController,
      title: string,
      id: string,
      token: string,
      timeleft: number,
      maxPage: number,
      startPage?: number,
      pusher: Pusher,
      downloadId: string
    }
)
  : Promise<number> {


  // 初めの時間はinitのtimeleftから3秒引いたものを使用しなくてはならない
  timeleft -= 3;

  // fetchにデフォルトのヘッダーを付加
  // abortControllerも渡すことで、イベントループから別のイベントループまたはメインスレッドのfetchを中止できる
  const client = new MyFetch({
    headers: {

      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh-TW;q=0.6,zh;q=0.5",
      "Authorization": `Bearer ${token}`,
      "Origin": "https://www.m2plus.com",
      "Priority": "u=1, i",
      "Referer": "https://www.m2plus.com/",
      "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest"
    },
    signal: abortController.signal
  })
  // 秒数ごとのエラー回数を保存（クロージャでどのサイクルでも同じメモリ領域を参照できる）
  const errorCount: Record<number, number> = {};
  // 3秒ごとにtimeleftを更新し、m3サーバーに送信するintervalを作成し、実行
  const fetchInterval = setInterval(async () => {
    try {
      // m3に残り時間情報を送信する
      // pagesで現在のページ情報を渡している。（startPage変数はfetchImage関数内で更新される）
      const data = {
        "timeleft": timeleft,
        "zoomedIn": false,
        "pages": startPage === 1 ? [1] : startPage === maxPage ? [maxPage] : [startPage, startPage + 1]
      }
      // もしエラーレスポンスが返った場合、clientはエラーをthrowする
      const response = await client.post(`https://api.m2plus.com/api/v1/book/${id}/trial/time`, { json: data });
      console.log(timeleft, response.status);

      // pusherに残り時間情報を送信する
      const pusherResponse = await pusher.trigger(downloadId, "download",
        { type: "timeleft", timeleft },
        // userCountを取得するためのパラメーター
        {
          info: "subscription_count,user_count"
        }
      );
      // triggerのresponseにはsubscription_countが含まれている
      // クライアントから接続を切った場合、pusherのlistenerが0になる
      const userCount = (await pusherResponse.json()).channels[downloadId].subscription_count;
      console.log("userCount:", userCount);

      if (userCount === 0) {
        console.log("pusherのリスナーがいなくなりました");
        // クライアントサイドからキャンセルされたので、abortControllerをabortし、fetchImage関数を終了する。
        abortController.abort();
        // setIntervalを停止する
        clearInterval(fetchInterval);
      }

      // 無事成功した場合しかtimeleftはマイナスされない
      timeleft = timeleft - 3;

      // もしtimeleftが0以下になった場合、abortControllerをabortし、fetchImage関数を終了する。
      if (timeleft <= 0) {
        abortController.abort();
        pusher.trigger(downloadId, "download", { type: "finish", reason: "timeup" });
        clearInterval(fetchInterval);
      }

      // もしエラーが発生した場合、エラー回数をカウントする。
      // エラー回数が3回以上になった場合、abortControllerをabortし、fetchImage関数を終了する。
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("fetchImage trigger abort")
        clearInterval(fetchInterval);
      } else {
        console.log(`${timeleft}秒\n`, "インターバルエラー", error);
        errorCount[timeleft] = (errorCount[timeleft] ?? 0) + 1;
        if (errorCount[timeleft] >= 3) {
          console.log(`${timeleft}秒\n`, "インターバルエラー", "連続3回エラー");
          pusher.trigger(downloadId, "download", { type: "finish", reason: "timeleftError" });
          abortController.abort();
          clearInterval(fetchInterval);
        }
      }
    }
  }, 3000);

  // 画像のダウンロードを開始する関数
  const fetchImage = async () => {
    try {
      // setIntervalで３秒後に処理が開始するので、fetchImage関数も初めに３秒待つ
      await new Promise(resolve => setTimeout(resolve, 3000));
      let isFirstRequest = true;
      // ページごとのエラー回数を保存
      const errorCount: Record<number, number> = {};
      // まず、book_id.txtをsupabaseのtitlefolderに保存する
      await saveBookId(title, id);
      // ページ番号がmaxPageを超えるまで繰り返す
      while (startPage <= maxPage) {
        try {
          // 最初のリクエストページは必ず１ページ目、２回目以降は引数に渡されたstartPageを使用
          // 基本的にcurrentPage=startPageであるが、初回だけ1を入れたいため、currentPage変数を使用している。
          const currentPage = isFirstRequest ? 1 : startPage;
          // if, elseで同じ変数を使用するためブロック外でlet宣言
          let url = "";
          // 奇数ページもしくはmaxPage（終端）の場合、1ページ分の画像を取得する
          if (currentPage % 2 === 1 || currentPage === maxPage) {
            url = `https://api.m2plus.com/api/v1/book/${id}/trial/get/${currentPage}`;
          }
          // それ以外は２ページ分
          else {
            url = `https://api.m2plus.com/api/v1/book/${id}/trial/get/${currentPage}:${currentPage + 1}`;
          }
          console.log(`page=${currentPage}`);
          // 画像はbase64形式で返ってくる。
          // エラーレスポンスの場合、clientはエラーをthrowする
          const response = await client.get(url);
          const data: { image: string } = await response.json();
          const base64image = data.image;
          // 画像を保存する
          await saveImage(base64image, title, currentPage, (currentPage % 2 === 0) && (currentPage < maxPage));
          // クライアントサイドに取得ページ(progress)を送信する
          pusher.trigger(downloadId, "download", { type: "image", page: currentPage });
          console.log(currentPage, "download success");

          // 初回リクエストの場合、２回目のページを決定する（2ページ目かもともとの引数のstartPageか、奇数ページの場合は1ページ進めたもの）
          if (isFirstRequest) {
            isFirstRequest = false;
            startPage = startPage === 1 ? 2 : startPage;
          }
          // 初回リクエストでない場合、奇数ページの場合は1ページ進め、偶数ページの場合は2ページ進める
          else if (currentPage !== maxPage) {
            if (currentPage % 2 === 1) {
              startPage += 1;
            } else {
              startPage += 2;
            }
          } 
          // elseつまりcurrentPage === MaxPageの場合、startPageに１だけ加算する。
          // 偶数であろうが、奇数であろうが最終ページなので１しか加算しない。
          // whileの条件にstartPage <= maxPageがあるため、currentPage > maxPageになることはない。
          else {
            startPage++;
          }
          // 300ms待ってから次のループに移行する(人間っぽく)
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          // setIntervalでabortされた場合、fetchImage関数を終了する。
          if ((error as Error).name === "AbortError") {
            console.log("interval trigger abort");
            return;
          } else {
            // ページごとのエラー回数をカウントする。
            // currentPageはtryブロックで宣言されているので使用できない
            errorCount[startPage] = (errorCount[startPage] ?? 0) + 1;
            console.log(`${startPage}ページ\n`, "画像取得エラー", error);

            // エラー回数が3回以上になった場合、abortControllerをabort→setIntervalを停止
            // return;→fetchImage関数を終了
            if (errorCount[startPage] >= 3) {
              console.log(`${startPage}ページ\n`, "画像取得エラー", "連続3回エラー");
              pusher.trigger(downloadId, "download", { type: "finish", reason: "imageError" });
              abortController.abort();
              return;
            }
            // エラーが３回未満の場合、300ms待ってから次のループに移行する
            // startPageは更新されていないので、同じページの処理が繰り返される
            await new Promise(resolve => setTimeout(resolve, 300));
            continue;

          }

        }
      }
      console.log("fetchImage finish");
      // 最後のページの処理が終了したら、abortControllerをabort→setIntervalを停止
      abortController.abort();

    }
    // エラー３回で終了した場合→startPageはダウンロードできていない→endPage=startPage-1
    // すべてのページがダウンロードできた場合→startPageはmaxPage+1になっている→endPage=maxPage=startPage-1
    finally {
      startPage--;
    }
  }
  await fetchImage();
  // 戻り値はendPage
  return startPage;
}


// async function test() {
//   const { m3login, getToken } = await import("./utils/loginUtil");


//   const client = MyFetch.createPC();
//   const { token: { idToken } } = await getToken(client, await m3login(client, "holmirr707@gmail.com", "nnb0427T!"));
//   const { title, id } = await getTitleAndId("https://www.m2plus.com/content/6816?referrer1Name=%E3%82%B7%E3%83%8A%E3%82%B8%E3%83%BC&referrer1To=%2Fsearch%3Fp%3D24&eop_source_page=m2plus_3.0&eop_source_content=contents_item_img");

//   const init = await getInit(id, idToken);
//   console.log(init);

//   const endPage = await getBook(new AbortController(), title, id, idToken, init.timeleft, init.total_images, Math.floor((init.total_images - 5) / 2) * 2);
//   console.log("endpage", endPage);
//   if (endPage >= init.total_images) {
//     createAndUploadPDF(title);
//   }
// }
