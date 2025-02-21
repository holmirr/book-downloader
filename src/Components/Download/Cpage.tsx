'use client'
import { useState, useEffect, useRef } from 'react';
import DownloadButton from './DownloadButton';
import URLform from './URLform';
import Progress from './Progress';
import Result from './Result';
import { useRouter } from 'next/navigation';

export default function ClientPage({ title, id, initialLeftTime, totalPage, startPage = 1, refresh, isExist, notFound }: { title: string, id: string, initialLeftTime: number, totalPage: number, startPage: number, refresh: number, isExist: boolean, notFound: boolean }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(startPage);
  const [leftTime, setLeftTime] = useState(initialLeftTime);
  const [finishMessage, setFinishMessage] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isFirstMountForDownload = useRef(true);
  const router = useRouter();

  useEffect(() => {
    setLeftTime(initialLeftTime);
  }, [initialLeftTime]);

  useEffect(() => {
    setLoading(false);
    setProgress(startPage);
  }, [refresh]);

  useEffect(() => {
    if (isFirstMountForDownload.current) {
      isFirstMountForDownload.current = false;
      return;
    }
    if (!isDownloading) {
      router.replace(`/dashboard/download?${new URLSearchParams({ title: title ?? "", id: id ?? "" }).toString()}`);
    }
  }, [isDownloading]);


  // EventSource インスタンスを参照するための useRef を作成
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleDownload = () => {
    setFinishMessage("");
    setPdfMessage("");
    const eventSource = new EventSource(`/api/download?${new URLSearchParams({ title: title ?? "", id: id ?? "", startPage: startPage.toString() }).toString()}`);
    // 作成した EventSource を参照に保存
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "timeleft":
          setLeftTime(data.timeleft);
          break;
        case "image":
          setProgress(data.page);
          break;
        case "timeleftError":
          // エラー処理
          break;
        case "imageError":
          // エラー処理
          break;
        case "finish":
          switch (data.reason) {
            case "timeup":
              setFinishMessage("時間切れです");
              setIsDownloading(false);

              eventSource.close();
              eventSourceRef.current = null;
              break;
            case "timeleftError":

              setFinishMessage("インターバルエラーです");
              setIsDownloading(false);
              eventSource.close();
              eventSourceRef.current = null;
              break;

            case "imageError":
              setFinishMessage("画像取得エラーです");
              setIsDownloading(false);
              eventSource.close();
              eventSourceRef.current = null;
              break;

            case "complete":
              setFinishMessage("ダウンロード完了しました");
              break;
          }
        // 完了時に EventSource を閉じる
        case "pdf":
          switch (data.reason) {
            case "start":
              setPdfMessage("PDF作成中です");
              break;
            case "success":
              setPdfMessage("PDF作成完了しました");
              setIsDownloading(false);
              eventSourceRef.current = null;
              break;
            case "error":
              setPdfMessage("PDF作成エラーです");
              setIsDownloading(false);
              eventSourceRef.current = null;
              break;
          }
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.log("EventSourceエラー", error);
      setFinishMessage("接続エラーが発生しました");
      eventSource.close();
      setIsDownloading(false);
      eventSourceRef.current = null;
    };


    setIsDownloading(true);
  };

  const handleCancel = () => {
    // eventSourceRef.current が存在すれば close() を呼び出して接続をキャンセル
    if (eventSourceRef.current) {
      console.log("close is called")
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setFinishMessage("ダウンロードがキャンセルされました");
    setIsDownloading(false);
  };

  return (
    <>
      <URLform setLoading={setLoading} loading={loading} setFinishMessage={setFinishMessage} setPdfMessage={setPdfMessage} />
      {isExist ? (
        <div>
          <p>{title}</p>
          <p>ダウンロード済みです</p>
        </div>
      ) :
        notFound ? (
          <div>
            <p>{title}</p>
            <p>立ち読みが提供されていません</p>
          </div >
        ) : (
          <>
            <Progress title={title} progress={progress} totalPage={totalPage} leftTime={leftTime} loading={loading} />
            <Result finishMessage={finishMessage} pdfMessage={pdfMessage} isDownloading={isDownloading} />
            <DownloadButton loading={loading} leftTime={leftTime} isDownloading={isDownloading} handleCancel={handleCancel} handleDownload={handleDownload} maxPage={totalPage} startPage={startPage} />
          </>
        )
      }
    </>
  );
}
