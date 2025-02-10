import { getInit } from "@/lib/books";
import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/database";
import ClientPage from "@/Components/Download/Cpage";
export default async function DownloadPage({ searchParams }: { searchParams: Promise<{ title: string, id: string }> }) {
  const { title, id } = await searchParams;
  let timeleft: number | undefined;
  let total_images: number | undefined;
  let perSeconds: number | undefined;
  if (title && id) {
    const email = (await auth())?.user?.email ?? "";
    if (!email) redirect("/login");
    const user = await getUser(email);
    console.log(user);
    if (!user?.token_info.token) redirect("/login");
    ({ timeleft, total_images } = await getInit(id, user.token_info.token));
    console.log(await getInit(id, user.token_info.token));
    perSeconds = timeleft / Math.floor((total_images) / 2);
  }

  return (
    <div>
      <h1>Download</h1>

      <ClientPage title={title} id={id} initialLeftTime={timeleft as number} totalPage={total_images as number} startPage={1} />


    </div>






  )
}

