import { signOut } from "@/auth/auth";

export async function GET(request: Request) {
  await signOut({ redirectTo: "/login" });
  return new Response("Signed out", { status: 200 });
}
