import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getGoogleTokens, saveGoogleTokens } from "./utils/database";
import { Readable } from "stream";

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

export async function ensureValidTokens() {
  const tokens = await getGoogleTokens();
  if (!tokens) {
    throw new Error("No tokens found");
  }
  oauth2Client.setCredentials(tokens);
  const now = new Date();
  if (tokens.expiry_date && now > new Date(tokens.expiry_date)) {
    console.log("current token expired, refreshing");
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      await saveGoogleTokens(credentials);
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      throw new Error("refresh token expired");
    }
  }
  return oauth2Client;
}

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/drive",
    ],
    prompt: "consent",
  });
}

export async function handleAuthCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  await saveGoogleTokens(tokens);
  return tokens;
}

export async function getDriveClient() {
  const oauth2Client = await ensureValidTokens();
  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function listFiles() {
  try {
    const drive = await getDriveClient();
    const res = await drive.files.list({
      q: `'${process.env.GOOGLE_PARENT_FOLDER_ID}' in parents and mimeType = 'application/pdf' and trashed = false`,
      fields: "files(id, name, webViewLink, createdTime)",
      pageSize: 1000,
    });
    return res.data.files;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
}

export async function uploadPDFBuffer(pdfBuffer: Buffer, fileName: string) {
  try {
    const drive = await getDriveClient();
    const response = await drive.files.create({
      requestBody: {
        name: `${fileName}.pdf`,
        parents: [process.env.GOOGLE_PARENT_FOLDER_ID as string],
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

