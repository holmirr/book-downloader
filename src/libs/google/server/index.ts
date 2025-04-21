// サーバーサイドで動作する関数

import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getGoogleTokens, saveGoogleTokens } from "@/libs/supabase/server/database";
import { Readable } from "stream";

// 認証用のOAuth2Clientを作成
// clientId→アプリケーション自体のID
// clientSecret→アプリケーション自体のパスワードのようなもの（クライアントに渡したらダメ）    
// redirectUri→認証後、認可コードを送るリダイレクト先
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

// getTokenがtrueの場合は、oauth2Clientではなく、access_token: stringを返す。
// これは、クライアントサイドにアクセストークンを渡す際に使用する引き数である。
export async function ensureValidTokens(getToken=false) {
  // supabaseのdbからトークンを取得
  let tokens = await getGoogleTokens();
  // もしトークンが文字列型なら、JSON.parseでオブジェクトに変換
  if (typeof tokens === "string") {
    tokens = JSON.parse(tokens);
  }
  // もしトークンがdbにない場合はエラー
  if (!tokens) {
    throw new Error("No tokens found");
  }
  // トークンをoauth2Clientにセット
  oauth2Client.setCredentials(tokens);
  // トークンの有効期限を確認
  const now = new Date();
  // もしトークンの有効期限が切れていたら、リフレッシュトークンを使用し、新しいアクセストークンを取得。
  if (tokens.expiry_date && now > new Date(tokens.expiry_date)) {
    console.log("current token expired, refreshing");
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      // 新しいアクセストークンをセット
      oauth2Client.setCredentials(credentials);
      // 新しいトークンをdbに保存
      await saveGoogleTokens(credentials);
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      throw new Error("refresh token expired");
    }
  }
  if (getToken) {
    // もしgetTokenがtrueなら、アクセストークンを返す
    const token = oauth2Client.credentials.access_token;
    if (!token)  throw new Error("No access token found");
    return token;
  }
  return oauth2Client;
}

// 認可サーバーへのurlを生成する関数
export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/drive",
    ],
    prompt: "consent",
  });
}

// 認可コードを受け取り、アクセストークンを取得し、dbに保存する関数
export async function handleAuthCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  await saveGoogleTokens(tokens);
  return tokens;
}

// ドライブクライアントを取得する関数
export async function getDriveClient() {
  const oauth2Client = await ensureValidTokens();
  return google.drive({ version: "v3", auth: oauth2Client });
}

// ファイルをリストアップする関数
export async function listFiles() {
  try {
    // ドライブクライアントを取得
    const drive = await getDriveClient();
    // ファイルをリストアップ
    const res = await drive.files.list({
      // 親フォルダのID, ファイルの種類, ゴミ箱のファイルを除外
      q: `'${process.env.NEXT_PUBLIC_GOOGLE_PARENT_FOLDER_ID}' in parents and mimeType = 'application/pdf' and trashed = false`,
      fields: "files(id, name, webViewLink, createdTime)",
      pageSize: 1000,
    });
    // 戻り値は、googledriveクライアント独自のファイルオブジェクト（.nameや.idなどのフィールドを持つ）のリスト
    return res.data.files;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
}

// バッファを受け取り、ファイルをアップロードする関数
export async function uploadPDFBuffer(pdfBuffer: Buffer, fileName: string) {
  try {
    // ドライブクライアントを取得
    const drive = await getDriveClient();
    const response = await drive.files.create({
      requestBody: {
        name: `${fileName}.pdf`,
        parents: [process.env.NEXT_PUBLIC_GOOGLE_PARENT_FOLDER_ID as string],
      },
      media: {
        mimeType: "application/pdf",
        body: Readable.from(pdfBuffer)
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading PDF buffer:", error);
    throw error;
  }
}

