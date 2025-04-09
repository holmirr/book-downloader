'use client';
import { handleURL } from "@/action/urlAction";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";


export default function URLform() {
  const router = useRouter();
  // useActionStateはserverActionをform elementで呼び出す際に、結果を受け取る方法を提供するために使用（serverAction + from以外では使用しない）
  const [urlActionState, urlAction, isPending] = useActionState(handleURL, { success: false, message: "" });
  // フォームの入力値を管理
  const [url, setUrl] = useState("");

  useEffect(() => {
    // 初回マウント時は実行しない
    if (urlActionState.message === "") return;

    if (urlActionState.success) {
      // もしサーバーがurlの解析に成功すれば、query paramsのstringが返ってくる。
      router.replace(`/dashboard/download?${urlActionState.message}`);
    } else {
      // もしサーバーがurlの解析に失敗すれば、エラーメッセージが返ってくる。
      // その場合は、まっさらのページにクライアントルーティングでリダイレクトし、エラーメッセージをalertする。
      router.replace("/dashboard/download");
      // このコンポーネントはリダイレクトによりアンマウントされないので、router.replace後も処理は実行される。
      alert(urlActionState.message);
      setUrl("");
    }
  }, [urlActionState]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <form action={urlAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URLを貼り付けてください
          </label>
          <input 
            type="text" 
            id="url"
            placeholder="URL" 
            name="url" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button 
          type="submit" 
          disabled={isPending || !url}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "送信中..." : "送信"}
        </button>
      </form>
    </div>
  )
}
