import { createTable } from "@/libs/database";

// テーブル作成はsupabaseクライアントでは不可能なので、postgresのクライアントを使用
export async function GET(request: Request) {
  try {
    await createTable();
  } catch (e) {
    console.error(e);
    return new Response("Database seed failed", { status: 500 });
  }
  return new Response("Database seed success", { status: 200 });
}

