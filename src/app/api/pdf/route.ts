import { NextRequest, NextResponse } from "next/server";
import { createAndUploadPDF } from "@/lib/utils/pdf";
import { deleteImage } from "@/lib/utils/strage";

export async function POST(request: NextRequest) {
  const { title } = await request.json();
  try {
    await createAndUploadPDF(title);
    console.log("pdf success")
    await deleteImage(title);
    console.log("deleteImage")
    return NextResponse.json({ message: "PDF作成とアップロードが完了しました" }, { status: 200 });
  } catch (error) {
    console.error("PDF作成とアップロードのエラー:", error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
