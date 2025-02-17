export default function Restrict({download_at}: {download_at: Date}) {
  const nextDownloadTime = new Date(download_at.getTime() + 1000 * 60 * 60 * 24);
  return (
    <div className="mt-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="flex items-center gap-3 text-yellow-800">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium">ダウンロード制限</h3>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-yellow-700">ダウンロードは1日1回までです。</p>
        <p className="text-yellow-700">
          次回ダウンロード可能時間: 
          <span className="font-medium">
            {nextDownloadTime.toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </p>
      </div>
    </div>
  );
}
