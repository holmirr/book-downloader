import { getBook } from "@/lib/books";
import { createPDF, deleteImage } from "@/lib/utils/files";
import { getUserFromSession } from "@/auth/auth";
import { getInit } from "@/lib/books";


function encode(data: any) {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}


export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const title = searchParams.get("title");
  console.log("id", id);
  console.log("title", title);
  if (!id || !title) return new Response("id もしくは title が指定されていません", { status: 401 });
  const user = await getUserFromSession();
  console.log("user", user);
  const token = user.token_info.token;

  const { total_images, timeleft } = await getInit(id, token);
  const abortController = new AbortController();
  // ReadableStream を作成して、SSE 用のストリームにする
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const endPage = await getBook(abortController, title, id, token, timeleft, total_images, 1, controller);
      if (endPage >= total_images) {
        try {
          createPDF(title);
          controller.enqueue(encode({ type: "pdf", reason: "success" }));
          deleteImage(title);
        } catch (error) {
          console.error("PDF作成エラー", error);
          controller.enqueue(encode({ type: "pdf", reason: "error" }));
        }
      }



    },
    cancel() {
      abortController.abort();
    }


  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
} 