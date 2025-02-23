"use client";

export default function DownloadButton({ isDownloading, handleCancel, handleDownload, handlePDF, leftTime, loading, maxPage, isCanceling, canPdf, pdfLoading }: { isDownloading: boolean, handleCancel: () => void, handleDownload: () => void, handlePDF: () => void, leftTime: number, loading: boolean, maxPage: number, isCanceling: boolean, canPdf: boolean, pdfLoading: boolean }) {
  if (loading) {
    return null;
  }
  
  if (isDownloading) {
    return (
      <button 
        disabled={isCanceling}
        onClick={handleCancel}
        className="mt-4 w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm sm:text-base"
      >
        {isCanceling ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            キャンセル中...
          </div>
        ) : (
          'キャンセル'
        )}
      </button>
    )
  } else if (canPdf) {
    return (
      <button 
        onClick={handlePDF} 
        disabled={loading || pdfLoading}
        className="mt-4 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        {pdfLoading ? "PDF作成中..." : "PDFに変換する"}
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
