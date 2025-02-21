import { downloadControllers } from "../route";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const downloadId = searchParams.get("downloadId");
  if (!downloadId) return new Response("downloadId が指定されていません", { status: 401 });
  const abortController = downloadControllers.get(downloadId);
  if (!abortController) return new Response("abortController が見つかりません", { status: 401 });
  abortController.abort();
  return new Response("canceled", { status: 200 });
}

