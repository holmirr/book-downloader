"use server";
import { getTitleAndId } from "@/lib/books";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function handleURL(prevState: { success: boolean, message: string }, formData: FormData) {
  try {
    const url = formData.get("url");
    const { title, id } = await getTitleAndId(url as string);
    if (title && id) {

      // revalidatePath("/dashboard/download");
      // redirect(`/dashboard/download?title=${encodeURIComponent(title)}&id=${id}`);
      return { success: true, message: `title=${encodeURIComponent(title)}&id=${id}` };
    } else {
      console.log(`title: ${title}, id: ${id}`);
      return { success: false, message: "URLが正常に解析されませんでした" };
    }
  } catch (error) {
    // リダイレクトエラーの判定
    if (error instanceof Error && 'digest' in error && 
        typeof error.digest === 'string' && 
        error.digest.startsWith('NEXT_REDIRECT')) {
      // リダイレクトエラーなので再スロー
      throw error;
    }
    
    return { success: false, message: "URLが正常に解析されませんでした" };
  }
}
