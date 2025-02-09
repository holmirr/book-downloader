import URLform from "@/Components/URLform";
import { getInit } from "@/lib/books";
import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/database";
export default async function DownloadPage({ searchParams }: { searchParams: Promise<{ title: string, id: string }> }) {
  const { title, id } = await searchParams;
  let timeleft: number | undefined;
  let total_images: number | undefined;
  let perSeconds: number | undefined;
  if (title && id) {
    const email = (await auth())?.user?.email ?? "";
    console.log(email);

    if (!email) redirect("/login");
    const user = await getUser(email);
    console.log(user);
    if (!user?.token_info.token) redirect("/login");
    ({ timeleft, total_images } = await getInit(id, user.token_info.token));
    perSeconds = timeleft / Math.floor((total_images) / 2);
  }

  return (
    <div>
      <h1>Download</h1>
      <URLform />
      <p>{title}</p>
      <p>{timeleft===undefined || `残り時間: ${timeleft}秒`}</p>
      <p>{total_images===undefined || `総ページ数: ${total_images}`}</p>
      <p>{perSeconds===undefined  || (perSeconds > 0.3 ? `1ページあたりの時間: ${(perSeconds).toFixed(2)}秒` : `1ページあたりの時間: ${perSeconds.toFixed(2)}秒は0.3秒より短いため、ダウンロードできません`)}</p>
    </div>





  )
}

