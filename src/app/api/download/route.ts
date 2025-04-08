import { getBook } from "@/libs/books";
import { getUserFromSession } from "@/auth/auth";
import { getInit } from "@/libs/books";
import { updateUser } from "@/libs/supabase/server/database";
import { getPusherInstance } from "@/libs/pusher/server";

export async function POST(request: Request): Promise<Response> {
  // downloadIdは、クライアント側で作成したpusherのための識別子。
  // この識別子をもとに、pusherのチャンネルを作成する。
  const { id, title, downloadId, startPage = 1 } = await request.json();
  if (!id || !title || !downloadId) return new Response("id もしくは title もしくは downloadId が指定されていません", { status: 401 });
  // jwt payloadからemailを取得し、dbからUserオブジェクトを取得
  const user = await getUserFromSession();
  // m3のアクセストークンを取得
  const token = user.token_info.token;

  // ページ数と残り時間を取得
  const { total_images, timeleft } = await getInit(id, token);
  // ダウンロードを中止するためのAbortControllerを作成→引き数に渡す
  const abortController = new AbortController();
  // pusherインスタンス(サーバー用)を初期化→引き数に渡す
  const pusher = getPusherInstance();

  // ダウンロードを実行
  // ダウンロードの終了ページを取得
  const endPage = await getBook({abortController, title, id, token, timeleft, maxPage: total_images, startPage, pusher, downloadId}  );
  console.log("endPage:", endPage);
  
  // ダウンロードが完了したら、データベース中のユーザーのダウンロード時間を更新
  if (endPage >= total_images) {
    try {
      await updateUser(user.email, { download_at: new Date() });
    } catch (error) {
      console.error("ダウンロード時間更新エラー", error);
      pusher.trigger(downloadId, "download", { type: "finish", reason: "databaseError" });
    } 
  }

  // ダウンロード失敗時はすでにpusherをunsubscribeしているため、このメッセージは成功時のみ届く。
  pusher.trigger(downloadId, "download", { type: "finish", reason: "complete" });
  // fetch自体のレスポンスを返す。
  return new Response("finished");
} 