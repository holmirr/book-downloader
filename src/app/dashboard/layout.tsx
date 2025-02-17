import { signOut } from "@/auth/auth";
import { updateUser } from "@/lib/utils/database";
import { isValidToken } from "@/lib/utils/time";
import { MyFetch } from "@/lib/utils/network";
import { m3login, getToken } from "@/lib/utils/loginUtil";
import { getUserFromSession } from "@/auth/auth";
import Sidebar from "@/Components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { email, password, token_info: { expires_at }, name } = await getUserFromSession();
  const isValid = isValidToken(expires_at);

  if (!isValid) {
    try {
      const client = MyFetch.createPC();
      const conde = await m3login(client, email, password);
      const data = await getToken(client, conde);
      const token = data.token.idToken;
      const expires_at = data.token.expiresAt;
      await updateUser(email, { token_info: { token, expires_at } });
    } catch (e) {
      console.log(e);
      await signOut({ redirectTo: "/login" });
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
          <div className="h-[40px] md:h-auto flex items-center md:block mb-6 sm:mb-8 lg:mb-10">
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 font-medium px-2 md:px-0 pl-16 md:pl-2">ようこそ、{name}さん</p>
          </div>
          <div className="px-1 sm:px-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}