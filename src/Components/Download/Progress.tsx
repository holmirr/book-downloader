"use client";

export default function Progress({ progress, totalPage, leftTime }: { progress: number, totalPage: number, leftTime: number }) {
  return (
    <div>
      <progress value={progress} max={totalPage} />
      <p>{leftTime}秒経過</p>
    </div>
  )
}
