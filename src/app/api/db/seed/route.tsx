import { createTable } from "@/lib/utils/database";

export async function GET(request: Request) {
  try {
    await createTable();
  } catch (e) {
    console.error(e);
    return new Response("Database seed failed", { status: 500 });
  }
  return new Response("Database seed success", { status: 200 });
}

