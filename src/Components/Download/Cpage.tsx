'use client'
import { useState, useEffect, useRef } from 'react';
import DownloadButton from './DownloadButton';
import URLform from './URLform';
import Progress from './Progress';
import Result from './Result';
import { useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher/client';


export default function ClientPage({ title, id, initialLeftTime, totalPage, startPage = 1, refresh, isExist, notFound }: { title: string, id: string, initialLeftTime: number, totalPage: number, startPage: number, refresh: number, isExist: boolean, notFound: boolean }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(startPage);
  const [leftTime, setLeftTime] = useState(initialLeftTime);
  const [finishMessage, setFinishMessage] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canPdf, setCanPdf] = useState(startPage > totalPage);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
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

  useEffect(() => {
    if (downloadId) {
      pusherClient.subscribe(downloadId);

      const handleError = (errorType: string, message: string) => {
        setFinishMessage("接続エラーが発生しました");
        setIsDownloading(false);
        setDownloadId(null);
      };

      pusherClient.bind("error", (error: any) => {
        console.error("Pusherエラー:", error);
        handleError("connection", "サーバーとの接続エラーが発生しました");
      });

      pusherClient.bind("download", (data: any) => {
        try {
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
                  setDownloadId(null);
                  break;
                case "timeleftError":
                  setFinishMessage("インターバルエラーです");
                  setIsDownloading(false);
                  setDownloadId(null);
                  break;
                case "imageError":
                  setFinishMessage("画像取得エラーです");
                  setIsDownloading(false);
                  setDownloadId(null);
                  break;
                case "complete":
                  setFinishMessage("ダウンロード完了しました");
                  setCanPdf(true);
                  setIsDownloading(false);
                  setDownloadId(null);
                  break;
              }
          }
        } catch (error) {
          console.error("Pusherメッセージ処理エラー:", error);
          handleError("general", "予期せぬエラーが発生しました");
        }
      });
    }

    return () => {
      if (downloadId) {
        pusherClient.unsubscribe(downloadId);
        pusherClient.unbind("download");
        pusherClient.unbind("error");
      }
    }
  }, [downloadId]);

  const handleDownload = async () => {
    const downloadId = Math.random().toString(36).slice(2, 15);
    console.log("downloadId:", downloadId);
    setDownloadId(downloadId);
    setFinishMessage("");
    setPdfMessage("");
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/download`,
        {
          method: "POST",
          body: JSON.stringify({
            title: title,
            id: id,
            startPage: startPage,
            downloadId: downloadId ?? ""
          })
        }
      );
      if (!res.ok) {
        throw new Error("ダウンロードに失敗しました");
      }
    } catch (error) {
      console.error("fetch error:", error);
      setFinishMessage("サーバー接続が解除されました");
      setIsDownloading(false);
      setDownloadId(null);
    }
  };

  const handleCancel = async () => {
    setIsCanceling(true);
    setDownloadId(null);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsDownloading(false);
    setIsCanceling(false);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    setPdfMessage("PDF作成中です");
    const res = await fetch(`/api/pdf`,
      {
        method: "POST",
        body: JSON.stringify({ title: title })
      }
    );
    if (!res.ok) {
      setPdfMessage("PDF作成に失敗しました");
    } else {
      setPdfMessage("PDF作成完了しました");
      setCanPdf(false);
      router.replace(`/dashboard/download?${new URLSearchParams({ title: title ?? "", id: id ?? "" }).toString()}`);
    }
    setPdfLoading(false);
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
            <DownloadButton loading={loading} leftTime={leftTime} isDownloading={isDownloading} handleCancel={handleCancel} handleDownload={handleDownload} handlePDF={handlePDF} maxPage={totalPage} isCanceling={isCanceling} canPdf={canPdf} pdfLoading={pdfLoading} />
          </>
        )
      }
    </>
  );
}
