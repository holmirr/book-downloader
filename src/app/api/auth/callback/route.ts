import { NextRequest, NextResponse } from "next/server";
import { handleAuthCallback } from "@/lib/google";
import { saveGoogleTokens } from "@/lib/utils/database";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }
  try {
    const tokens = await handleAuthCallback(code);
    await saveGoogleTokens(tokens);
    console.log("tokens", tokens);
    return NextResponse.redirect(request.nextUrl.origin);
  } catch (error) {
    console.error("Error in auth callback", error);
    return NextResponse.json({ error: "Failed to handle auth callback" }, { status: 500 });
  }
}