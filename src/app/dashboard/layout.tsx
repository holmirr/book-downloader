import { auth, signOut } from "@/auth/auth";
import { getUser, updateUser } from "@/lib/utils/database";
import { redirect } from "next/navigation";
import { isValidToken } from "@/lib/utils/time";
import { isValid } from "zod";
import { MyFetch } from "@/lib/utils/network";
import { m3login, getToken } from "@/lib/utils/loginUtil";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const mail = session?.user?.email;
  if (!mail) redirect("/login");
  const user = await getUser(mail);
  if (!user) redirect("/login");
  const password = user.password;
  const expires_at = user.token_info.expires_at;
  const isValid = isValidToken(expires_at);
  if (!isValid) {
    try {
      const client = MyFetch.createPC();
      const conde = await m3login(client, mail, password);
      const data = await getToken(client, conde);
      const token = data.token.idToken;
      const expires_at = data.token.expiresAt;
      user.token_info = { token, expires_at };
      await updateUser(mail, { token_info: { token, expires_at } });
    } catch (e) {
      console.log(e);
      await signOut({ redirectTo: "/login" });
    }
  }

  return (
    <div>

      <h1>Dashboard</h1>
      <p>Hello, {user.name}</p>
      {children}
    </div>
  );
}