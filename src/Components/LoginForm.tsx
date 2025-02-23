"use client";
import { login } from "@/action/loginAction";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Lock } from 'lucide-react';

export default function Login() {
  const searchParams = useSearchParams();
  const [loginState, loginAction, isPending] = useActionState(login, { message: "" });

  return (
    <div className="min-h-[400px] w-full max-w-md mx-auto bg-white/90 backdrop-blur rounded-xl shadow-lg p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">ログイン</h1>
        <p className="text-gray-500 text-sm">m3アカウントにサインインして続行</p>
      </div>

      <form action={loginAction} className="space-y-4">
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="メールアドレス"
              disabled={isPending}
              name="email"
              required
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-indent-[4px]"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="password"
              placeholder="パスワード"
              disabled={isPending}
              name="password"
              required
              minLength={6}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-indent-[4px]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>ログイン中...</span>
            </div>
          ) : (
            'ログイン'
          )}
        </button>

        <input type="hidden" name="redirectTo" value={searchParams.get('callbackUrl') || '/dashboard'} />
      </form>

      {loginState?.message && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {loginState.message}
        </div>
      )}
    </div>
  );
}
