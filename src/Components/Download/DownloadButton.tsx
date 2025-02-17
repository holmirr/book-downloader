"use client";

export default function DownloadButton({ isDownloading, handleCancel, handleDownload, leftTime, loading, maxPage, startPage }: { isDownloading: boolean, handleCancel: () => void, handleDownload: () => void, leftTime: number, loading: boolean, maxPage: number, startPage: number }) {
  if (loading) {
    return null;
  }
  
  if (isDownloading) {
    return (
      <button 
        onClick={handleCancel}
        className="mt-4 w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm sm:text-base"
      >
        キャンセル
      </button>
    )
  } else if (startPage > maxPage) {
    return (
      <button 
        onClick={handleDownload} 
        disabled={loading}
        className="mt-4 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        PDFに変換する
      </button>
    )
  } else if (leftTime <= 0) {
    return (
      <div className="mt-4 w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-600 rounded-md text-sm sm:text-base">
        <p>時間切れです</p>
      </div>
    )
  } else if (leftTime && maxPage) {
    return (
      <button 
        onClick={handleDownload} 
        disabled={loading}
        className="mt-4 w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        ダウンロード開始
      </button>
    )
  }
  return null;
}
