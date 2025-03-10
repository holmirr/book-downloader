"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

          if (error.message === "refresh token expired" || error.message === "No tokens found" || error.message === "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error." ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 rounded-lg shadow-lg bg-white">
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            GoogleDriveの認証期限切れ
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              認証期限が切れています。
            </p>
            <p className="text-gray-600">
              再度認証を行ってください。
            </p>
            <p className="text-gray-600">
              アカウント：hypoisbest@gmail.com
            </p>
            <p className="text-gray-600">
              パスワード：hashima2025
            </p>
            <a
              href="/api/auth/setup"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              認証画面へ
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 rounded-lg shadow-lg bg-white">
        <h2 className="text-3xl font-bold text-red-600 mb-4">
          エラーが発生しました
        </h2>
        <p className="text-gray-600 mb-6">
          申し訳ありませんが、問題が発生しました。
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            エラー: {error.message}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            もう一度試す
          </button>
        </div>
      </div>
    </div>
  );
}