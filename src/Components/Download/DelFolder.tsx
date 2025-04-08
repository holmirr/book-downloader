"use client";

import { useState } from "react";
import { delFolderAction } from "@/action/delFolderAction";
import { useRouter } from "next/navigation";

// GoogleDriveに存在する、かつ、SupabaseのStorageにもすべてのページが存在する場合に表示されるコンポーネント
// GoogleDriveにアップした後、supabaseからフォルダーをremoveするので、このコンポーネントは通常は表示されない。
export default function DelFolder({title, id, _finishMessage}: {title: string, id: string, _finishMessage: string}) {
  const [isLoading, setIsLoading] = useState(false);
  // 前回のページ（状態）を引き継ぐために使用
  const [finishMessage, setFinishMessage] = useState(_finishMessage);
  // finishMessageにエラーが含まれているかどうかを判断→赤色で表示
  const error = finishMessage.includes("エラー") || finishMessage.includes("解除") || finishMessage.includes("失敗");
  // 削除成功後リダイレクト
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // フォルダーを削除するサーバーアクション
      // 失敗したらエラーを投げる。
      await delFolderAction(title);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setFinishMessage("フォルダを削除エラー");
      return;
    }
    // 成功したら、リダイレクト
    setIsLoading(false);
    const successMessage = "フォルダを削除完了";
    setFinishMessage(successMessage);
    // setFinishMessageしたのに、finishMessageを参照しない理由は、handleClickが参照するfinishMessageは初めに設定された定数だから（クロージャ
    // 新しいfinishMessageは新しいDelFolder関数のコールスタックで作成されている。
    router.push(`/dashboard/download?title=${title}&id=${id}&finishMessage=${successMessage}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {finishMessage && (
        <div className={`p-4 rounded-lg ${error ? "bg-red-50" : "bg-green-50"}`}>
          <p className={`text-${error ? "red" : "green"}-600`}>{finishMessage}</p>
        </div>
      )}
      <button
      onClick={handleClick}
      className="bg-red-500 text-white px-4 py-2 rounded-md"
      disabled={isLoading}
      >
        {isLoading ? "削除中..." : "フォルダを削除"}
      </button>
    </div>
  )
}
