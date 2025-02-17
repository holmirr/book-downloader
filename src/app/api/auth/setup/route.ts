import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";

export function GET() {
  const authUrl = getAuthUrl();
  return NextResponse.json({ authUrl });
}
