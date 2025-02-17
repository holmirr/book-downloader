import { google } from "googleapis";
import { Credentials, OAuth2Client } from "google-auth-library";
import { promises as fs, createReadStream } from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "token.json");

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

async function saveTokens(tokens: Credentials) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
}

async function loadTokens(): Promise<Credentials | null> {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

export async function ensureValidTokens() {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error("No tokens found");
  }
  oauth2Client.setCredentials(tokens);
  const now = new Date();
  if (tokens.expiry_date && now > new Date(tokens.expiry_date)) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    await saveTokens(credentials);
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
  await saveTokens(tokens);
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

export async function uploadFile(filePath: string) {
  try {
    const drive = await getDriveClient();
    console.log(process.env.GOOGLE_PARENT_FOLDER_ID);
    const response = await drive.files.create({
      requestBody: {
        name: path.basename(filePath),
        parents: [process.env.GOOGLE_PARENT_FOLDER_ID as string],
      },
      media: {
        mimeType: "application/pdf",
        body: createReadStream(filePath),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

