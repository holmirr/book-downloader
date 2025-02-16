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
    <div>
      <form action={urlAction}>

        <label htmlFor="url">URLを貼り付けてください</label>
        <input type="text" placeholder="URL" name="url" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit" disabled={loading}>
          {loading ? "送信中..." : "送信"}
        </button>
      </form>
    </div>
  )

}
