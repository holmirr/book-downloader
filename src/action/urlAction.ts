"use server";
import { getTitleAndId } from "@/libs/books";

export async function handleURL(
  prevState: { success: boolean; message: string },
  formData: FormData
){
  try {
    // フォームからurlを取得
    const url: string | File | null = formData.get("url");
    // urlがnullの場合はエラーをスロー
    if (url instanceof File || url === null) {
      throw new Error("url = null");
    }
    // urlから本のtitleとidを取得
    const { title, id } = await getTitleAndId(url);
    
    if (title && id) {
      // 取得したtitleとidをクエリパラメータの形に成形してjsonとして返す。→クライアントでreplace()でクライアントルーティング
      // ここでredirect()してしまうと、redirect()+Formなので、すべてのコンポーネントが再レンダリングされてしまう。
      return { success: true, message: `title=${encodeURIComponent(title)}&id=${id}` };
    } else {
      return { success: false, message: "URLが正常に解析されませんでした" };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "URLが正常に解析されませんでした" };
  }
}
