// import { NextRequest, NextResponse } from "next/server";
// import { saveGoogleTokens } from "@/lib/utils/database";
// import * as fs from "fs";
// import path from "path";

// export async function GET(request: NextRequest) {
//   const TOKEN_PATH = path.join(process.cwd(), "token.json");
//   const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
//   await saveGoogleTokens(tokens);
//   return NextResponse.json({ message: "Googleトークンシード完了" });
// }

export async function GET() {
  return Response.json({ message: "処理非表示中" });
}

