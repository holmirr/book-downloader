"use client";

export default function Result({ finishMessage, pdfMessage, isDownloading, finish }: { finishMessage: string, pdfMessage: string, isDownloading: boolean, finish: boolean }) {
  return (
    <div>
        {finishMessage && !isDownloading && !finish && (
          <div>
            <p>ダウンロード結果：</p>
            <p>{finishMessage}</p>
          </div>
        )}

        {pdfMessage && (
          <div>
            <p>PDF作成結果：</p>
            <p>{pdfMessage}</p>
          </div>
        )}
      </div>
  )
}


