"use server";
import { getTitleAndId } from "@/lib/books";

export async function handleURL(
  prevState: { success: boolean; message: string },
  formData: FormData
){
  try {
    const url = formData.get("url");
    const { title, id } = await getTitleAndId(url as string);
    if (title && id) {
      return { success: true, message: `title=${encodeURIComponent(title)}&id=${id}` };
    } else {
      return { success: false, message: "URLが正常に解析されませんでした" };
    }
  } catch (error) {
    return { success: false, message: "URLが正常に解析されませんでした" };
  }
}
