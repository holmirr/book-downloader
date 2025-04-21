"use server";
import { createAndUploadPDF } from "@/libs/pdf/server";
import { deleteImage } from "@/libs/supabase/server/storage";

export async function pdfAction(title: string) {
  await createAndUploadPDF(title);
  await deleteImage(title);
}