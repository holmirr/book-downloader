import { getInit } from "@/lib/books";
import { getUserFromSession } from "@/auth/auth";
import ClientPage from "@/Components/Download/Cpage";
import { getStartPage } from "@/lib/utils/strage";
import { listFiles } from "@/lib/google";
import { getIsMaster } from "@/lib/utils/database";
import Restrict from "@/Components/Download/Restrict";

export default async function DownloadPage({ searchParams }: { searchParams: Promise<{ title: string | undefined, id: string | undefined }> }) {
  const user = await getUserFromSession();
  const { title, id } = await searchParams;
  const safeTitle = title?.replace(/\//g, '_') ?? "";
  const startPage = await getStartPage(title ?? "");
  let notFound = false;
  let timeleft: number | undefined;
  let total_images: number | undefined;
  let restricted = false;
  const files = await listFiles();
  if (!await getIsMaster(user.name)) {
    if (user.download_at) {
      if (Date.now() - user.download_at.getTime() < 1000 * 60 * 60 * 24) {
        restricted = true;
      }
    }
  }
  const isExist = files?.some((file) => file.name?.split(".pdf")[0] === safeTitle) ?? false;
  if (title && id) {
    try {
      ({ timeleft, total_images } = await getInit(id, user.token_info.token));
    } catch (error) {
      notFound = true;
    }
  }

  return (
    restricted ? <Restrict download_at={user.download_at ?? new Date()} /> : (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-gray-50 to-gray-100 py-3 sm:py-6 px-2 sm:px-4 lg:px-6">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-6 px-1">Download</h1>
        <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4 lg:p-6">
          <ClientPage 
            title={title ?? ""} 
            id={id ?? ""} 
            initialLeftTime={timeleft as number} 
            totalPage={total_images as number} 
            startPage={startPage} 
            refresh={Math.random()} 
            isExist={isExist} 
            notFound={notFound} 
          />
        </div>
      </div>
    </div>
  ));
}

