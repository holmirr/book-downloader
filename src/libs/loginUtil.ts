import crypto from "crypto";
import { MyFetch } from "./network";
import { TokenResponse } from "./types";

/*
m2plusへのログインはm3のopenid認証（認可コードフロー）を利用している。
１．m2plusは既にm3への認可サーバーへのurlを設置している。(client_id, redirect_uri, scope, stateをあらかじめ設定している)→stateはブラウザのstorageに保存される。
２．1のurlにアクセスすると、m3側で1のurlをoriginurlパラメーターとした更に深部の認可サーバーへリダイレクトされる。
３．2のurlにPOSTリクエストで認証を行う。
４．redirect_uri(m2plus/auth/redirect)にcode,stateを設定されリダイレクト。
５．4のurlにアクセスすると、jsがダウンロードされ、そのjsがcodeを取得し、codeをm2plusのサーバーに送信する。（「ブラウザが」保存してあるstateとparamのstateを比較する。
６．m2plusのサーバーはcodeを受け取り、m3へ送り、tokenを取得する。
７．m3はtokenをクライアントへ返す。
８．クライアントはtokenを保存し、以降のリクエストではm3のidtokenをm2plusのaccessTokenとして使用する。
*/

// 10文字のランダムな文字列を生成する
export const createHash = () => {
  const t = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  // Array(10)で10個の要素を持つ配列を生成（ただし、実際の配列の要素はempty）
  // spread operatorで展開することで、undefinedの要素を10個含む配列にする。
  // mapで各要素に対してtの中からランダムに1文字ずつ選択(Math.random()は0以上1未満→配列の長さで乗算すると0以上配列の長さ未満の数になる)
  // joinで配列を文字列に変換する。
  return [...Array(10)].map(() => t[Math.floor(Math.random() * t.length)]).join("")
}

// ランダムなstateを生成する
export const createState = () => {
  const t = createHash();
  return crypto.createHash("sha256").update(t + Date.now()).digest("hex");
}

// m2plusのclient_id
export const client_id = "UpUTEmS_guovvfB9a7KxmK17-N_xxpRrygOXaI5Pio8";

// m3 openidの認証URLを生成する
export const getAuthURL = (t: string) => {
  // response_type: 認可コードフロー
  // scopeにopenidが含まれる→oauth2.0のtokenと一緒にopenidのidtokenも取得できる
  const param = {
    response_type: "code",
    client_id: client_id,
    redirect_uri: "https://www.m2plus.com/auth/redirect",
    scope: "openid system_code doctor_code is_doctor hp_gp name kana_name email birthdate specialties organization prefecture qualification_code",
    state: t
  }
  const e = new URLSearchParams(param).toString();
  return "https://www.m3.com/openid/connect/authorize?" + e
}

// 認可コードを取得し、returnする
export const m3login = async (client: MyFetch, id: string, password: string) => {
  try {
    // m3へ認証、認可を行い、codeを取得する。
    const state = createState();
    const origURL = getAuthURL(state);
    const res = await client.post("https://www.m3.com/openid/login/",

      {
        urlencoded: {
          rememberMeEnabled: "on",
          rpGroup: "",
          origURL,
          loginId: id,
          password: password,
          autoLogin: "1"
        }
      }
    )
    const url = new URL(res.url);
    const code = url.searchParams.get("code");
    if (!code) {
      throw new Error("code not found...\n" + res.url);
    }
    return code;
  } catch (e) {
    console.log("login failed");
    throw e;
  }
}

// 認可コードからidtoken, accessToken, refreshTokenを取得する
export const getToken: (client: MyFetch, code: string) => Promise<TokenResponse> = async (client, code) => {
  try {
    const res = await client.post<TokenResponse>("https://api.m2plus.com/api/v2/user/login", {
      json: {
        code,
      }
    });
    return res.data;
  } catch (e) {
    console.log("cannot get token because code is invalid");
    throw e;
  }
}