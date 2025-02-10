'use client'
import { useState, useRef } from 'react';
import DownloadButton from './DownloadButton';
import URLform from './URLform';
import BookInfo from './BookInfo';
import Progress from './Progress';
import Result from './Result';

export default function ClientPage({ title, id, initialLeftTime, totalPage, startPage = 1 }: { title: string, id: string, initialLeftTime: number, totalPage: number, startPage: number }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(startPage);
  const [leftTime, setLeftTime] = useState(initialLeftTime);
  const [finishMessage, setFinishMessage] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");
  const [finish, setFinish] = useState(false);

  // EventSource インスタンスを参照するための useRef を作成
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleDownload = () => {
    const eventSource = new EventSource(`/api/download?${new URLSearchParams({ title: title ?? "", id: id ?? "" }).toString()}`);
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
              setFinish(true);
              eventSource.close();
              eventSourceRef.current = null;
              break;
            case "timeleftError":

              setFinishMessage("インターバルエラーです");
              setIsDownloading(false);
              setFinish(true);
              eventSource.close();
              eventSourceRef.current = null;
              break;

            case "imageError":
              setFinishMessage("画像取得エラーです");
              setIsDownloading(false);
              setFinish(true);
              eventSource.close();
              eventSourceRef.current = null;
              break;

            case "complete":
              setFinishMessage("ダウンロード完了しました");
              break;
          }
          // 完了時に EventSource を閉じる
          break;
        case "pdf":
          switch (data.reason) {
            case "success":
              setPdfMessage("PDF作成完了しました");
              break;
            case "error":
              setPdfMessage("PDF作成エラーです");
              break;
          }
          setIsDownloading(false);
          setFinish(true);
          eventSource.close();
          eventSourceRef.current = null;
          break;

      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSourceエラー", error);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("接続が閉じられました");
      }
      setIsDownloading(false);
      setFinish(true);
      eventSourceRef.current = null;
    };


    setIsDownloading(true);
  };

  const handleCancel = () => {
    // eventSourceRef.current が存在すれば close() を呼び出して接続をキャンセル
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsDownloading(false);
    setFinish(true);
  };

  return (
    <div>
      <URLform setFinishMessage={setFinishMessage} setPdfMessage={setPdfMessage} setFinish={setFinish} />
      {isDownloading ? (
        <Progress progress={progress} totalPage={totalPage} leftTime={leftTime} />
      ) : finish ? (
        <Result finishMessage={finishMessage} pdfMessage={pdfMessage} isDownloading={isDownloading} finish={finish} />
      ) : (
        <div>
          <Progress progress={progress} totalPage={totalPage} leftTime={leftTime} />
          <BookInfo title={title} timeleft={leftTime} totalPage={totalPage} startPage={progress} finish={finish} />
        </div>
      )}
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
      <DownloadButton isDownloading={isDownloading} handleCancel={handleCancel} handleDownload={handleDownload} />
    </div>
  );
}
