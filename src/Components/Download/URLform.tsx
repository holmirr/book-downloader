'use client';
import { handleURL } from "@/action/urlAction";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function URLform({ setFinishMessage, setPdfMessage, setFinish }: { setFinishMessage: (message: string) => void, setPdfMessage: (message: string) => void, setFinish: (finish: boolean) => void }) {
  const router = useRouter();
  const [urlActionState, urlAction, isPending] = useActionState(handleURL, { success: false, message: "" });
  const [url, setUrl] = useState("");





  useEffect(() => {
    if (urlActionState.success) {
      router.replace(`/dashboard/download?${urlActionState.message}`);


    } else {
      router.replace("/dashboard/download")
    }
    setFinishMessage("");
    setPdfMessage("");
    setFinish(false);
    setUrl("");

  }, [urlActionState])


  return (
    <div>
      <form action={urlAction}>

        <label htmlFor="url">URLを貼り付けてください</label>
        <input type="text" placeholder="URL" name="url" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit" disabled={isPending}>

          {isPending ? "送信中..." : "送信"}
        </button>
      </form>
      {urlActionState.success || <p>{urlActionState.message}</p>}
    </div>




  )

}
