// 認可コードフローにおけるコールバックルート
// 認可コードをparseし、tokenと交換する
// トークンを保存し、/へリダイレクト

import { NextRequest, NextResponse } from "next/server";
import { handleAuthCallback } from "@/libs/google/server";
import { saveGoogleTokens } from "@/libs/supabase/server/database";

export async function GET(request: NextRequest) {
  // 認可コードを取得
  const code = request.nextUrl.searchParams.get("code");
  // 認可コードがない場合はエラーを返す
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }
  try {
    // 認可コードを認可サーバーに送信してtokenを取得
    const tokens = await handleAuthCallback(code);
    // 取得したtokenを保存
    await saveGoogleTokens(tokens);
    // リダイレクト
    // .originはリクエスト"先"URLのオリジン（プロトコル＋ホスト名＋ポート）を返すプロパティ
    // つまり、リダイレクト先は"/"ルート
    return NextResponse.redirect(request.nextUrl.origin);
  } catch (error) {
    // エラーが発生した場合はエラーをレスポンスする
    console.error("Error in auth callback", error);
    return NextResponse.json({ error: "Failed to handle auth callback" }, { status: 500 });
  }
}