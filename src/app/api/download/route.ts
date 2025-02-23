import { getBook } from "@/lib/books";
import { createAndUploadPDF } from "@/lib/utils/pdf";
import { deleteImage } from "@/lib/utils/strage";
import { getUserFromSession } from "@/auth/auth";
import { getInit } from "@/lib/books";
import { updateUser } from "@/lib/utils/database";
import { getPusherInstance } from "@/lib/pusher/server";

export async function POST(request: Request): Promise<Response> {
  const { id, title, downloadId, startPage = 1 } = await request.json();
  if (!id || !title || !downloadId) return new Response("id もしくは title もしくは downloadId が指定されていません", { status: 401 });
  const user = await getUserFromSession();
  const token = user.token_info.token;

  const { total_images, timeleft } = await getInit(id, token);
  const abortController = new AbortController();
  const pusher = getPusherInstance();

  const endPage = await getBook(abortController, title, id, token, timeleft, total_images, startPage, pusher, downloadId);
  console.log("endPage:", endPage);
  if (endPage >= total_images) {
    try {
      pusher.trigger(downloadId, "download", { type: "pdf", reason: "start" });
      console.log("pdf start")
      await createAndUploadPDF(title);
      console.log("pdf success")
      await deleteImage(title);
      console.log("deleteImage")
      await updateUser(user.email, { download_at: new Date() });
      console.log("updateUser")
      pusher.trigger(downloadId, "download", { type: "pdf", reason: "success" });
      console.log("pusher.trigger(downloadId, \"download\", { type: \"pdf\", reason: \"success\" });")
    } catch (error) {
      console.error("PDF作成エラー", error);
      pusher.trigger(downloadId, "download", { type: "pdf", reason: "error" });
      console.log("pusher.trigger(downloadId, \"download\", { type: \"pdf\", reason: \"error\" });")
    } 
  }
  return new Response("finished");
} 