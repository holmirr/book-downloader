"use client";

export default function Progress({ title, progress, totalPage, leftTime, loading }: { title: string, progress: number, totalPage: number, leftTime: number, loading: boolean }) {
  const percentage = Math.round((progress / totalPage) * 100);
  console.log(`progress: ${progress}, totalPage: ${totalPage}, percentage: ${percentage}`)

  return (
    loading ? (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    ) : progress > totalPage ? (
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <p>{title}</p>
        <p className="text-green-600">すでにダウンロードが完了しています</p>
      </div>
    ) : (
      <div className="space-y-4 p-4 bg-white rounded-lg shadow">
        {totalPage && leftTime && (
          <>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    進行状況
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${percentage}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <p>{progress}/{totalPage}ページ</p>
                <p>残り{leftTime}秒</p>
              </div>
            </div>
          </>
        )}
      </div>
    )
  )
}
