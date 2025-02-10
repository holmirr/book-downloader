"use client";

export default function BookInfo({ title, timeleft, totalPage, startPage, finish }: { title: string, timeleft: number, totalPage: number, startPage: number, finish: boolean }) {
  return (
    <div>
      <p>{title}</p>

      <p>残り{timeleft}秒</p>
      <p>総ページ数{totalPage}</p>
      <p>開始ページ{startPage}</p>
    </div>
  )

}
