import { signOut } from "@/auth/auth";

// jwt削除はAPIエンドポイントやサーバーアクション内でしか行えないため、エンドポイントを作成。
export async function GET(request: Request) {
  await signOut({ redirectTo: "/login" });
  return new Response("Signed out", { status: 200 });
}
