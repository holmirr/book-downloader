
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getUser } from "@/lib/utils/database";
import { m3login, getToken } from "@/lib/utils/loginUtil";
import { MyFetch } from "@/lib/utils/network";
import { createUser, getPermissions } from "@/lib/utils/database";
import { DBUser } from "@/lib/types";
import { redirect } from "next/navigation";
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (user && user.password === password) {
            return {
              email: user.email,
            };
          } else {
            const client = MyFetch.createPC();
            try {
              const code = await m3login(client, email, password);
              const data = await getToken(client, code);
              const name = data.userAccount.familyName + " " + data.userAccount.firstName;
              const isAdmin = await getPermissions(name);
              if (!isAdmin) {
                throw new AuthorizationError("権限がありません");
              }
              const tokenInfo = {
                token: data.token.idToken,
                expires_at: data.token.expiresAt
              }
              await createUser(email, password, data.userAccount.familyName + " " + data.userAccount.firstName, tokenInfo, null);
              return {
                email,
              };
            } catch (e) {
              console.error(e);
              return null;
            }

          }
        }
        return null;
      }
    })],

});

export async function getUserFromSession(): Promise<DBUser> {
  try {
    const session = await auth();
    if (!session) {
      redirect("/api/signout");
  }
  const email = session.user?.email;
  if (!email) {
    redirect("/api/signout");
  }
  const user = await getUser(email);
  if (!user) {
    redirect("/api/signout");
  }
  return user;
  } catch (e) {
    console.log(e);
    redirect("/api/signout");
  }
}
