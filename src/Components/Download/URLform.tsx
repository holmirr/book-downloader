'use client';
import { handleURL } from "@/action/urlAction";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";


export default function URLform({setLoading, loading, setFinishMessage, setPdfMessage }: { setLoading: (loading: boolean) => void, loading: boolean, setFinishMessage: (message: string) => void, setPdfMessage: (message: string) => void }) {
  const router = useRouter();
  const [urlActionState, urlAction, isPending] = useActionState(handleURL, { success: false, message: "" });
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (isPending) {
      setLoading(true);
    } 
  }, [isPending])

  useEffect(() => {
    // 初回マウント時は実行しない
    if (urlActionState.message === "") return;
    setFinishMessage("");
    setPdfMessage("");

    if (urlActionState.success) {
      router.replace(`/dashboard/download?${urlActionState.message}`);
    } else {
      router.replace("/dashboard/download");
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
          disabled={loading || !url}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "送信中..." : "送信"}
        </button>
      </form>
    </div>
  )
}
