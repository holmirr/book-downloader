import { MyFetch } from "./utils/network";
import * as cheerio from "cheerio";
import { InitInfo } from "./types";
import { saveImage, saveBookId } from "./utils/strage";
import Pusher from "pusher";

export async function getTitleAndId(url: string) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    const $ = cheerio.load(data);
    let title = "";
    let id = "";
    const initData: any[] = JSON.parse($("script#__NUXT_DATA__").text());
    const detailIndex: number = initData.find(item => item && typeof item === "object" && Object.keys(item).includes("detail")).detail;
    title = initData[initData[detailIndex].title];
    id = initData[initData[initData[initData[detailIndex].books][0]].id];

    return { title, id };
  } catch (error) {
    console.log("タイトルとID取得エラー");
    console.log(error);
    throw error;
  }
}

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
    return await response.json();

  } catch (error) {
    console.log("初期情報取得エラー");
    throw error;
  }
}

export async function getBook(abortController: AbortController, _title: string, _id: string, token: string, leftTime: number, _maxPage: number, startPage: number = 1, pusher: Pusher, downloadId: string) {
  leftTime -= 3;
  const title = _title;
  const id = _id;
  const maxPage = _maxPage;

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


  const fetchInterval = setInterval(async () => {
    const errorCount: { [key: number]: number } = {};
    try {
      const data = {
        "timeleft": leftTime,
        "zoomedIn": false,
        "pages": startPage === 1 ? [1] : startPage === maxPage ? [maxPage] : [startPage, startPage + 1]
      }

      const response = await client.post(`https://api.m2plus.com/api/v1/book/${id}/trial/time`, { json: data });
      console.log(leftTime, response.status);
      const pusherResponse = await pusher.trigger(downloadId, "download",
        { type: "timeleft", timeleft: leftTime },
        {
          info: "subscription_count,user_count"
        }
      );
      const userCount = (await pusherResponse.json()).channels[downloadId].subscription_count;
      console.log("userCount:", userCount);
      
      if (userCount === 0) {
        console.log("pusherのリスナーがいなくなりました");
        abortController.abort();
        pusher.trigger(downloadId, "download", { type: "finish", reason: "cancel" });
        clearInterval(fetchInterval);
      }

      leftTime = leftTime - 3;


      if (leftTime <= 0) {
        abortController.abort();
        pusher.trigger(downloadId, "download", { type: "finish", reason: "timeup" });
        clearInterval(fetchInterval);
      }



    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("fetchImage trigger abort")
        clearInterval(fetchInterval);
      } else {
        console.log(`${leftTime}秒\n`, "インターバルエラー", error);
        pusher.trigger(downloadId, "download", { type: "timeleftError", timeleft: leftTime });
        errorCount[leftTime] = (errorCount[leftTime] ?? 0) + 1;
        if (errorCount[leftTime] >= 3) {

          console.log(`${leftTime}秒\n`, "インターバルエラー", "連続3回エラー");
          pusher.trigger(downloadId, "download", { type: "finish", reason: "timeleftError" });
          abortController.abort();
          clearInterval(fetchInterval);

        }
      }
    }
  }, 3000);

  const fetchImage = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      let isFirstRequest = true;
      const errorCount: { [key: number]: number } = {};
      await saveBookId(title, id);
      while (startPage <= maxPage) {
        try {
          const currentPage = isFirstRequest ? 1 : startPage;
          let url = "";
          if (currentPage % 2 === 1 || currentPage === maxPage) {
            url = `https://api.m2plus.com/api/v1/book/${id}/trial/get/${currentPage}`;
          } else {
            url = `https://api.m2plus.com/api/v1/book/${id}/trial/get/${currentPage}:${currentPage + 1}`;
          }
          console.log(`page=${currentPage}`);
          const response = await client.get(url);
          const data: { image: string } = await response.json();

          const base64image = data.image;
          saveImage(base64image, title, currentPage, (currentPage % 2 === 0) && (currentPage < maxPage));
          pusher.trigger(downloadId, "download", { type: "image", page: currentPage });
          console.log(currentPage, "download success");


          if (isFirstRequest) {
            isFirstRequest = false;
            startPage = startPage === 1 ? 2 : startPage;
          } else if (currentPage < maxPage) {
            if (currentPage % 2 === 1) {
              startPage += 1;
            } else {
              startPage += 2;
            }
          } else {
            startPage++;
          }
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          if ((error as Error).name === "AbortError") {
            console.log("interval trigger abort");
            return;
          } else {
            errorCount[startPage] = (errorCount[startPage] ?? 0) + 1;
            console.log(`${startPage}ページ\n`, "画像取得エラー", error);
            pusher.trigger(downloadId, "download", { type: "imageError", page: startPage });

            if (errorCount[startPage] >= 3) {
              console.log(`${startPage}ページ\n`, "画像取得エラー", "連続3回エラー");
              pusher.trigger(downloadId, "download", { type: "finish", reason: "imageError" });
              abortController.abort();
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            continue;

          }

        }
      }
      console.log("fetchImage finish");
      abortController.abort();
      console.log("abortController.abort()");
      pusher.trigger(downloadId, "download", { type: "finish", reason: "complete" });
      console.log("pusher.trigger(downloadId, \"download\", { type: \"finish\", reason: \"complete\" });");
    }

    finally {
      startPage--;
    }
  }
  await fetchImage();
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
