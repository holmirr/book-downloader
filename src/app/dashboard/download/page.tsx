import { getInit } from "@/lib/books";
import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/database";
import ClientPage from "@/Components/Download/Cpage";
import { getStartPage } from "@/lib/utils/files";

export default async function DownloadPage({ searchParams }: { searchParams: Promise<{ title: string | undefined, id: string | undefined }> }) {
  const { title, id } = await searchParams;
  const startPage = getStartPage(title ?? "");
  let timeleft: number | undefined;
  let total_images: number | undefined;
  let perSeconds: number | undefined;
  if (title && id) {
    const email = (await auth())?.user?.email ?? "";
    if (!email) redirect("/login");
    const user = await getUser(email);
    if (!user?.token_info.token) redirect("/login");
    ({ timeleft, total_images } = await getInit(id, user.token_info.token));
    perSeconds = timeleft / Math.floor((total_images) / 2);
  }

  return (
    <div>
      <h1>Download</h1>

      <ClientPage title={title ?? ""} id={id ?? ""} initialLeftTime={timeleft as number} totalPage={total_images as number} startPage={startPage} refresh={Math.random()}/>


    </div>






  )
}

