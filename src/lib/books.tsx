import { MyFetch } from "./utils/network";
import * as cheerio from "cheerio";
import { saveImage, createPDF } from "./utils/files";

export async function getTitleAndId(url: string) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    const $ = cheerio.load(data);
    let title = "";
    let id = "";
    $("script").each((i, el) => {

      const script = $(el).text();
      if (script.includes("window.__NUXT__=")) {
        title = script.match(/title:"([^"]+)"/)?.[1] ?? "";
        id = script.match(/id:\s*(\d+)/)?.[1] ?? "";
        return false;
      }

    });
    return { title, id };
  } catch (error) {
    console.log("タイトルとID取得エラー");
    throw error;
  }
}

export async function getInit(id: string, token: string): Promise<{
  maxtime: number,
  page_direction: string,
  timeleft: number,
  total_images: number,
}> {
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

export async function getBook(title: string, id: string, token: string, leftTime: number, maxPage: number, startPage: number = 1) {

  const abortController = new AbortController();

  leftTime -= 3;

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
    try {
      const data = {
        "timeleft": leftTime,
        "zoomedIn": false,
        "pages": startPage === 1 ? [1] : [startPage, startPage + 1]
      }

      console.log(`leftTime=${leftTime}`);
      const response = await client.post(`https://api.m2plus.com/api/v1/book/${id}/trial/time`, { json: data });
      console.log(leftTime, response.status);
      leftTime = leftTime - 3;
      if (leftTime <= 0) {
        abortController.abort();
        clearInterval(fetchInterval);
      }


    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("fetchImage trigger abort")
        clearInterval(fetchInterval);
      } else {
        console.log("インターバルエラー", error);
      }
    }
  }, 3000);

  const fetchImage = async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    let isFirstRequest = true;
    while (startPage <= maxPage) {
      try {
        const currentPage = isFirstRequest ? 1 : startPage;
        const url = `https://api.m2plus.com/api/v1/book/${id}/trial/get/${currentPage === 1 ? 1 : `${currentPage}:${currentPage + 1}`}`;
        console.log(`page=${currentPage}`);
        const response = await client.get(url);
        const data: { image: string } = await response.json();
        const base64image = data.image;
        saveImage(base64image, title, currentPage, currentPage !== 1);
        console.log(currentPage, "download success");
        
        if (isFirstRequest) {
          isFirstRequest = false;
          startPage = startPage === 1 ? 2 : startPage;
        } else {
          startPage += 2;
        }
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("interval trigger abort")
          return;
        } else {
          console.log("画像取得エラー", error);
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
      }
    }
    abortController.abort();
  }

  await fetchImage();
  return startPage;
}




async function test() {
  const { m3login, getToken } = await import("./utils/loginUtil");


  const client = MyFetch.createPC();
  const { token: { idToken } } = await getToken(client, await m3login(client, "holmirr707@gmail.com", "nnb0427T!"));
  const { title, id } = await getTitleAndId("https://www.m2plus.com/content/6816?referrer1Name=%E3%82%B7%E3%83%8A%E3%82%B8%E3%83%BC&referrer1To=%2Fsearch%3Fp%3D24&eop_source_page=m2plus_3.0&eop_source_content=contents_item_img");
  
  const init = await getInit(id, idToken);
  console.log(init);
  const endPage = await getBook(title, id, idToken, init.timeleft, init.total_images, Math.floor((init.total_images -5)/2) * 2);
  console.log("endpage", endPage);
  if (endPage >= init.total_images) {
    createPDF(title);
  }


}
