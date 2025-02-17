"use client";
export default function Result({ finishMessage, pdfMessage, isDownloading }: { finishMessage: string, pdfMessage: string, isDownloading: boolean }) {
  if (isDownloading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-blue-600">ダウンロード中...</p>
        </div>
      </div>
    )
  } else {
    return (
      <div className="space-y-4">
        {finishMessage && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-600">{finishMessage}</p>
          </div>
        )}
        {pdfMessage && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-700">{pdfMessage}</p>
          </div>
        )}
      </div>
    )
  }
}


