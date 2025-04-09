"use server";

import { deleteImage } from "@/libs/supabase/server/storage";

export async function delFolderAction(title: string) {
  await deleteImage(title);
}
