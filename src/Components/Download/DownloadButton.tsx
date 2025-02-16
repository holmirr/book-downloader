"use client";

export default function DownloadButton({ isDownloading, handleCancel, handleDownload, leftTime, loading, maxPage, startPage }: { isDownloading: boolean, handleCancel: () => void, handleDownload: () => void, leftTime: number, loading: boolean, maxPage: number, startPage: number }) {
  if (isDownloading) {
    return (
      <button onClick={handleCancel}>キャンセル</button>
    )
  } else if (startPage > maxPage) {
    return (
      <button onClick={handleDownload} disabled={loading}>
        PDFに変換する
      </button>
    )
  } else if (leftTime <= 0) {
    return (
      <div>
        <p>時間切れです</p>
      </div>
    )
  } else if (leftTime && maxPage) {
    return (
      <button onClick={handleDownload} disabled={loading}>
        ダウンロード
      </button>
    )
  } else {
    return;
  }
}
