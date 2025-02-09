'use client';
import { handleURL } from "@/action/urlAction";
import { useState,useActionState, useEffect } from "react";   
import { useRouter } from "next/navigation";

export default function URLform() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(handleURL, { success: false, message: "" });
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (state.success) {
      router.replace(`/dashboard/download?${state.message}`)
    } else{
      router.replace("/dashboard/download")
    }
    setUrl("");
  }, [state])




  return (
    <div>
      <form action={action}>

        <label htmlFor="url">URLを貼り付けてください</label>
        <input type="text" placeholder="URL" name="url" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit" disabled={isPending}>
          {isPending ? "送信中..." : "送信"}
        </button>
      </form>
      {state.success || <p>{state.message}</p>}
    </div>



  )

}
