"use client";

export default function Progress({ title, progress, totalPage, leftTime, loading }: { title: string, progress: number, totalPage: number, leftTime: number, loading: boolean }) {

  return (
    loading ? (
      <div>
        <p>Loading...</p>
      </div>
    ) : progress > totalPage ? (
      <div>
        <p>すでにダウンロードが完了しています</p>
      </div>
    ) : (
      <div>
        {totalPage && leftTime && (
          <>
            <p>{title}</p>
            <progress value={progress} max={totalPage && 100} />
            <p>{progress}/{totalPage}ページ</p>
            <p>残り{leftTime}秒</p>
          </>
        )}
      </div>
    )
  )
}
