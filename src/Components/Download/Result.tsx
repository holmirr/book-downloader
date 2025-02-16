"use client";
export default function Result({ finishMessage, pdfMessage, isDownloading }: { finishMessage: string, pdfMessage: string, isDownloading: boolean }) {
  if (isDownloading) {
    return (
      <div>
        <p>ダウンロード中...</p>
      </div>
    )
  } else {
    return (
      <>
        {finishMessage && (
          <div>
            <p>{finishMessage}</p>
          </div>
        )}
        {pdfMessage && (
          <div>
            <p>{pdfMessage}</p>
          </div>
        )}
      </>
    )
  }
}


