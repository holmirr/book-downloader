import { auth, signOut } from "@/auth/auth";
import { getUser, updateUser } from "@/lib/utils/database";
import { redirect } from "next/navigation";
import { isValidToken } from "@/lib/utils/time";
import { isValid } from "zod";
import { MyFetch } from "@/lib/utils/network";
import { m3login, getToken } from "@/lib/utils/loginUtil";
import { getUserFromSession } from "@/auth/auth";

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
    <div>
      <h1>Dashboard</h1>
      <p>Hello, {name}</p>
      {children}
    </div>

  );
}