import { getBook } from "@/lib/books";
import { createAndUploadPDF} from "@/lib/utils/pdf";
import { deleteImage } from "@/lib/utils/strage";
import { getUserFromSession } from "@/auth/auth";
import { getInit } from "@/lib/books";
import { updateUser } from "@/lib/utils/database";

function encode(data: any) {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export const downloadControllers = new Map<string, AbortController>();

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const title = searchParams.get("title");
  const downloadId = searchParams.get("downloadId");
  const startPage = parseInt(searchParams.get("startPage") ?? "1");
  if (!id || !title || !downloadId) return new Response("id もしくは title もしくは downloadId が指定されていません", { status: 401 });
  const user = await getUserFromSession();
  const token = user.token_info.token;

  const { total_images, timeleft } = await getInit(id, token);
  const abortController = new AbortController();
  downloadControllers.set(downloadId, abortController);
  // ReadableStream を作成して、SSE 用のストリームにする
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const endPage = await getBook(abortController, title, id, token, timeleft, total_images, startPage, controller);
      if (endPage >= total_images) {
        try {
          controller.enqueue(encode({ type: "pdf", reason: "start" }));
          await createAndUploadPDF(title);
          await deleteImage(title);
          await updateUser(user.email, { download_at: new Date() });
          controller.enqueue(encode({ type: "pdf", reason: "success" }));
          console.log(request.signal.aborted);
        } catch (error) {
          console.error("PDF作成エラー", error);
          controller.enqueue(encode({ type: "pdf", reason: "error" }));
        } finally {
          controller.close();
        }
      }
    },
    // cancel() {
    //   console.log("readable stream cancel block")
    //   abortController.abort();
    //   console.log(request.signal.aborted);
    // }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
} 