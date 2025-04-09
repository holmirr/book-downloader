'use client'
import { useState, useEffect, useRef } from 'react';
import DownloadButton from './DownloadButton';
import URLform from './URLform';
import Progress from './Progress';
import Result from './Result';
import { useRouter } from 'next/navigation';
import { pusherClient } from '@/libs/pusher/client';


export default function DownloadSection({ title, id, initialLeftTime, totalPage, startPage, isExist, notFound, _finishMessage }: { title: string, id: string, initialLeftTime: number, totalPage: number, startPage: number, isExist: boolean, notFound: boolean, _finishMessage: string }) {
  // 初回マウント時はundefinedでuseEffect内部の処理が実行されないようにする
  const [isDownloading, setIsDownloading] = useState<boolean | undefined>(undefined);
  const [progress, setProgress] = useState(startPage);
  const [leftTime, setLeftTime] = useState(initialLeftTime);
  // 前ページの状態を引き継ぐために使用
  const [finishMessage, setFinishMessage] = useState(_finishMessage);
  // pusherのチャンネル名として利用
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 初回マウント時、つまりundefinedの場合は実行しない。
    // ダウンロード終了時にleftTimeやstartPageを更新するためにリダイレクト
    if (isDownloading === false) {
      const params = new URLSearchParams();
      if (title) params.set("title", title);
      if (id) params.set("id", id);
      if (finishMessage) params.set("finishMessage", finishMessage);
      router.replace(`/dashboard/download?${params.toString()}`);
    }
  }, [isDownloading]);

  useEffect(() => {
    // ダウンロード開始→downloadIdが生成された際にpusherにsubscribeする。
    if (downloadId) {
      pusherClient.subscribe(downloadId);

      // ダウンロード終了時の処理をあらかじめ定義
      const handleFinish = (message: string) => {
        setFinishMessage(message);
        setIsDownloading(false);
        setDownloadId(null);
      };

      // pusher通信のエラーを受け取った際の処理
      pusherClient.bind("error", (error: any) => {
        console.error("Pusherエラー:", error);
        handleFinish("pusherサーバーとの接続エラーが発生しました(中島まで連絡お願いします)");
      });

      // pusher通信のメッセージを受け取った際の処理
      pusherClient.bind("download", (data: any) => {
        try {
          switch (data.type) {
            // 残り時間を更新
            case "timeleft":
              setLeftTime(data.timeleft);
              break;
            // 進捗度（％）を更新
            case "image":
              setProgress(data.page);
              break;
            // ダウンロード終了時の処理
            case "finish":
              switch (data.reason) {
                case "timeup":
                  handleFinish("時間切れです");
                  break;
                case "timeleftError":
                  handleFinish("インターバルエラーです(中島まで連絡お願いします)");
                  break;
                case "imageError":
                  handleFinish("画像取得エラーです(中島まで連絡お願いします)");
                  break;
                case "databaseError":
                  handleFinish("データベース更新エラーです(中島まで連絡お願いします)");
                  break;
                case "complete":
                  handleFinish("ダウンロード完了しました");
                  break;
              }
          }
        } catch (error) {
          console.error("Pusherメッセージ処理エラー:", error);
          handleFinish("予期せぬエラーが発生しました(中島まで連絡お願いします)");
        }
      });
    }

    // useEffectの戻り値のコールバック関数はクリーンナップ関数と呼ばれる。
    // 実行されるのは、依存配列の値が変化し、次のuseEffectが実行される直前 or コンポーネントがアンマウントされる直前。
    // ちなみにクロージャが適応されるので、ここで使用されるdownloadIdはコールバックが実行される際ではなく、コールバックが定義された時点のもの。
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
    setDownloadId(downloadId);
    // ダウンロード開始したので前回のメッセージは不要。
    setFinishMessage("");
    setIsDownloading(true);
    try {
      // vercelのサーバーレス関数との通信も行う。
      // なぜなら、pusherだけでなくvercel上のエラーもとらえる必要があるから。
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
      // vercelのサーバーレス関数との通信が失敗した場合、エラーを投げる。
      // たいていの場合、１分制限オーバーでの40?レスポンス
      if (!res.ok) {
        console.log(await res.text());
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
    // サーバー上での処理が確実に終了するのを待つ。
    await new Promise(resolve => setTimeout(resolve, 5000));
    // その後、リダイレクトし、最新のleftTimeやstartPageを取得する。
    setIsDownloading(false);
    setIsCanceling(false);
  };

  return (
    <>
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
            <Progress title={title} progress={progress} totalPage={totalPage} leftTime={leftTime} />
            <Result finishMessage={finishMessage} isDownloading={!!isDownloading} />
            <DownloadButton leftTime={leftTime} isDownloading={!!isDownloading} handleCancel={handleCancel} handleDownload={handleDownload} maxPage={totalPage} isCanceling={isCanceling} />
          </>
        )
      }
    </>
  );
}
