"use client";
import { useState } from "react";
import { createPDF } from "@/libs/pdf/client";
import { uploadPDFonClient } from "@/libs/google/client";
import { useRouter } from "next/navigation";
import { useSearchParams, usePathname } from "next/navigation";
import { delFolderAction } from "@/action/delFolderAction";
import { pdfAction } from "@/action/pdfAction";
// コンポーネントの初回マウント時に１度だけ、デバイスの種類を取得する。
import { isMobile, isTablet } from "react-device-detect";

export default function PdfSection({ title, _finishMessage }: { title: string, _finishMessage: string }) {
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  // 成功したらボタンを非表示にするため
  const [isSuccess, setIsSuccess] = useState(false);
  // 前のページ（ダウンロード成功ページ）からのメッセージを受け取る。
  const [finishMessage, setFinishMessage] = useState(_finishMessage);
  // エラーメッセージは赤く表示させたいので
  const error = finishMessage.includes("エラー") || finishMessage.includes("解除") || finishMessage.includes("失敗");
  // 成功後リダイレクトするため
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleClickonMobile = async () => {
    try{
      setIsCreatingPdf(true);
      // サーバー上でｐｄｆ変換とアップロードを行う
      await pdfAction(title);
      setFinishMessage("pdfに変換完了");
      // ボタン非表示
      setIsSuccess(true);
      // 成功後リダイレクト
      const params = new URLSearchParams(searchParams);
      params.set("finishMessage", "pdfに変換完了");
      router.replace(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error(error);
      setFinishMessage("サーバー上でpdfに変換失敗");
    } finally {
      setIsCreatingPdf(false);
    }
  }
  
  const handleClickOnPC = async () => {
    try {
      setIsCreatingPdf(true);
      const safeTitle = title.replace(/\//g, "_");
      // supabaseのstorageのフォルダ名はhex文字列
      const folderName = Buffer.from(safeTitle).toString("hex");
      const res = await fetch("/api/getGoogleToken");
      if (!res.ok) {
        throw new Error("Failed to get Google token");
      }
      // googleapiのaccess_tokenをstringで取得
      const token = await res.text();
      // pdfのuint8arrayを取得
      const pdf = await createPDF(folderName);
      // ファイルをアップロード
      await uploadPDFonClient({ fileName: safeTitle, pdfBytes: pdf, token: token });
      let successMessage = "pdfに変換完了";
      try{
        await delFolderAction(title);
      } catch (error) {
        console.error(error);
        successMessage = "pdfに変換完了(画像フォルダー削除失敗)→スクショを中島まで送信ください";
      }
      setFinishMessage(successMessage);
      // ボタン非表示
      setIsSuccess(true);
      // リダイレクト
      const params = new URLSearchParams(searchParams);
      // ここでfinishMessage変数を参照してしまうと、setFinishMessage(successMessage)が実行される前のfinishMessage定数が参照される。
      // stateの更新も再レンダリングも既に終わっているが、このコールスタックにおいてはfinishMessage定数のクロージャは初めの値である。
      params.set("finishMessage", successMessage);
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      setFinishMessage("pdfに変換失敗");
      setIsCreatingPdf(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p>{title}</p>
      {finishMessage && (
        <div className={`p-4 rounded-lg ${error ? "bg-red-50" : "bg-green-50"}`}>
          <p className={`text-${error ? "red" : "green"}-600`}>{finishMessage}</p>
        </div>
      )}
      {isSuccess || (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex justify-center items-center"
          onClick={isMobile || isTablet ? handleClickonMobile : handleClickOnPC}
          disabled={isCreatingPdf}
        >
          {isCreatingPdf ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "pdfに変換"}
        </button>
      )}
    </div>
  )
}
