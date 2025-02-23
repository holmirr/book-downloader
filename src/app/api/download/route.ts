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
      await updateUser(user.email, { download_at: new Date() });
      console.log("updateUser")
    } catch (error) {
      console.error("ダウンロード時間更新エラー", error);
    } 
  }
  return new Response("finished");
} 