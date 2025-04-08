import { getInit } from "@/libs/books";
import { getUserFromSession } from "@/auth/auth";
import { getStartPage } from "@/libs/supabase/server/storage";
import { listFiles } from "@/libs/google/server";
import { getIsMaster } from "@/libs/supabase/server/database";
import Restrict from "@/Components/Download/Restrict";
import DownloadSection from "@/Components/Download/DownloadSection";
import { redirect } from "next/navigation";
import URLform from "@/Components/Download/URLform";
import PdfSection from "@/Components/Download/PdfSection";
import DelFolder from "@/Components/Download/DelFolder";
export default async function DownloadPage({ searchParams }: { searchParams: Promise<{ title: string | undefined, id: string | undefined, finishMessage: string | undefined }> }) {
  // jwt→dbからuserオブジェクトを取得。
  const user = await getUserFromSession();
  // masterユーザーでない場合、ダウンロード制限時間をチェック。
  if (!await getIsMaster(user.name)) {
    if (user.download_at) {
      // 最後のダウロード時間から24時間経過しているかチェック。
      if (Date.now() - user.download_at.getTime() < 1000 * 60 * 60 * 24) {
        // 過去の自分が書いた意図が全く不明なコード
        // const endPage = startPage - 10;
        // if (endPage < (total_images ?? 0)) {
        //   restricted = true;
        // }
        return <Restrict download_at={user.download_at ?? new Date()} />
      }
    }
    // user.download_atはdbでnullable。nullの場合は、ダウンロードを許す。
  }
  // クエリパラメータからtitleとid, finishMessageを取得。
  // finishMessageは、前回の状態を引き継ぐために使用。
  const { title, id, finishMessage } = await searchParams;

  // ifブロックやtryブロック,catchブロック内で変数を宣言すると、外では使えないため、あらかじめ宣言しておく。
  let notFound = false;
  let isExist = false;
  let timeleft: number = 0;
  let total_images: number = 0;
  let startPage: number = 1;

  // title,idが存在しない場合、URLFormだけを返すので、無駄な作業はしない。
  if (title && id) {
    // 正規表現リテラルを用い、タイトルに含まれる/を_に変換。
    const safeTitle = title?.replace(/\//g, '_') ?? "";
    // supabaseのStorageから開始ページを取得
    startPage = await getStartPage(title ?? "");

    try {
      // GoogleDriveからファイル一覧を取得。
      const files = await listFiles();
      // GoogleDriveのファイル一覧から、ダウンロードしたいファイルが既に存在するかどうかチェック。
      isExist = files?.some((file) => file.name?.split(".pdf")[0] === safeTitle) ?? false;
    } catch (error: unknown) {
      // GoogleのrefreshTokenが期限切れの場合、再度認可コードフローを行うために、リダイレクト
      if ((error as Error).message === "refresh token expired" || (error as Error).message === "No tokens found") {
        redirect("/dashboard/reAuth");
      } else {
        throw error;
      }
    }

    try {
      // いきなり{で始まると、javascriptはブロック文の始まりと解釈してしまうので、式は()で囲む。
      ({ timeleft, total_images } = await getInit(id, user.token_info.token));
    } catch (error) {
      // 本が見つからない場合、notFoundをtrueにする。
      notFound = true;
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-gray-50 to-gray-100 py-3 sm:py-6 px-2 sm:px-4 lg:px-6">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-6 px-1">Download</h1>
        <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4 lg:p-6">
          {!title || !id ?
            (
              <URLform />
            )
            // GoogleDriveにファイルが存在しない、かつ、supabaseのstorageですべての画像が保存されている。
            // その場合、PDF変換を行う。
            : !isExist && startPage > total_images ?
              (
                <>
                  <URLform />
                  <PdfSection title={title} _finishMessage={finishMessage ?? ""} />
                </>
              )
              // GoogleDriveにファイルが存在する、かつ、supabaseのstorageですべての画像が保存されている。
              // その場合、画像フォルダーを削除する。
              : isExist && startPage > total_images ?
                (
                  <>
                    <URLform />
                    <DelFolder title={title} id={id} _finishMessage={finishMessage ?? ""} />
                  </>
                )
                :
                (
                  <>
                    <URLform />
                    <DownloadSection
                      key={Math.random()}
                      title={title}
                      id={id}
                      initialLeftTime={timeleft}
                      totalPage={total_images}
                      startPage={startPage}
                      isExist={isExist}
                      notFound={notFound}
                      _finishMessage={finishMessage ?? ""}
                    />
                  </>
                )}
        </div>
      </div>
    </div>
  );
}

