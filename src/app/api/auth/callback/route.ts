import { NextRequest, NextResponse } from "next/server";
import { handleAuthCallback } from "@/lib/google";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }
  try {
    const tokens = await handleAuthCallback(code);
    return NextResponse.json(tokens);
  } catch (error) {
    return NextResponse.json({ error: "Failed to handle auth callback" }, { status: 500 });
  }
}