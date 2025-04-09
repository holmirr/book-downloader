import { NextResponse } from "next/server";
import { getAuthUrl } from "@/libs/google/server";

export function GET() {
  // 認可サーバーへの認可URLを取得
  const authUrl = getAuthUrl();
  // 認可URLにリダイレクト
  return NextResponse.redirect(authUrl);
}
