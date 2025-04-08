"use client";
export default function Result({ finishMessage, isDownloading }: { finishMessage: string, isDownloading: boolean }) {
  let error = false;
  // エラーが含まれているかどうかを判断→赤色で表示
  if (finishMessage.includes("エラー") || finishMessage.includes("解除") || finishMessage.includes("失敗")) {
    error = true;
  }
  return (
    <div className="space-y-4">
      {isDownloading && !finishMessage && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-blue-600">ダウンロード中...</p>
          </div>
        </div>
      )}
      {finishMessage && (
        <div className={`p-4 rounded-lg ${error ? "bg-red-50" : "bg-green-50"}`}>
          <p className={`text-${error ? "red" : "green"}-600`}>{finishMessage}</p>
        </div>
      )}
    </div>
  )
}


