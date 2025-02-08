"use client";
import { login } from "@/action/loginAction";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

export default function Login() {
  const searchParams = useSearchParams();
  const [loginState, loginAction, isPending] = useActionState(login, { message: "" });

  return (
    <div>
      <h1>ログイン</h1>
      <form action={loginAction}>
        <input type="text" placeholder="ユーザー名" disabled={isPending} name="email" required />
        <input type="password" placeholder="パスワード" disabled={isPending} name="password" required minLength={6}/>
        <button type="submit" disabled={isPending}>


          {isPending ? (
            <span className="animate-spin inline-block">🔄</span>
          ) : (
            'ログイン'
          )}
        </button>
        <input type="hidden" name="redirectTo" value={searchParams.get('callbackUrl') || '/dashboard'} />
      </form>
      {loginState?.message && <p>{loginState.message}</p>}
    </div>

  );

}
