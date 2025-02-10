"use client";

export default function DownloadButton({ isDownloading, handleCancel, handleDownload }: { isDownloading: boolean, handleCancel: () => void, handleDownload: () => void }) {
  return (
    <div>
      {isDownloading ? (
          <button onClick={handleCancel}>キャンセル</button>
      ) : (
        <button onClick={handleDownload}>
          ダウンロード
        </button>
      )}
    </div>
  )
}
