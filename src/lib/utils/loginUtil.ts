import crypto from "crypto";
import { MyFetch } from "./network";
import { TokenResponse } from "../types";

export const createHash = () => {
  const t = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return [...Array(10)].map(() => t[Math.floor(Math.random() * t.length)]).join("")
}


export const createState = () => {
  const t = createHash();
  return crypto.createHash("sha256").update(t + Date.now()).digest("hex");
}

export const client_id = "UpUTEmS_guovvfB9a7KxmK17-N_xxpRrygOXaI5Pio8";

export const getAuthCodeAndRedirect = (t: string) => {
  const param = {
    response_type: "code",
    client_id: client_id,
    redirect_uri: "https://www.m2plus.com/auth/redirect",

    scope: encodeURI("openid system_code doctor_code is_doctor hp_gp name kana_name email birthdate specialties organization prefecture qualification_code"),
    state: t
  }
  const e = Object.keys(param).map(t => t + "=" + param[t as keyof typeof param]).join("&");
  // location.href = "https://www.m3.com/openid/connect/authorize?" + e
  return "https://www.m3.com/openid/connect/authorize?" + e
}

export const m3login = async (client: MyFetch, id: string, password: string) => {
  try {
    const state = createState();
    const origURL = getAuthCodeAndRedirect(state);
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

export const getToken = async (client: MyFetch, code: string) => {
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
