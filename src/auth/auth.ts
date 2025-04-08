
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { m3login, getToken } from "@/libs/loginUtil";
import { MyFetch } from "@/libs/network";
import { getUser, createUser, getPermissions } from "@/libs/supabase/server/database";
import { DBUser } from "@/libs/types";

// Errorオブジェクトを継承し、カスタムエラーを作成→CredentialsProvider中のエラー
// ユーザー名が権限として登録されていないときにthrowされる。
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
      // CredentialsProviderのSignInで呼び出される関数
      // credentailsはユーザーが入力したフォームが渡される。→FormオブジェクトがRecord<string, unknown>型に自動変換されて渡される。
      async authorize(credentials) {
        // zodでバリデーションを行う。
        const parsedCredentials = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (user && user.password === password) {
            // signInの戻り値はjwt()コールバックのaccount引き数に渡される。
            return {
              email: user.email,
            };
          } else {
            // ユーザーが存在しない場合はm3にログインを試みる。
            const client = MyFetch.createPC();
            try {
              // 認可コードフローで認可コードを取得。
              // 認可コードは認証後、redirect_uriにリダイレクトされる際に取得。
              const code = await m3login(client, email, password);
              // 認可コードを使用してアクセストークン、idTokenを取得。
              const data = await getToken(client, code);
              // ユーザー名を取得。
              const name = data.userAccount.familyName + " " + data.userAccount.firstName;
              // ユーザー名がdbに許可ユーザーとして登録されているか確認
              const isAdmin = await getPermissions(name);
              if (!isAdmin) {
                // カスタムエラーを投げる。
                throw new AuthorizationError("権限がありません");
              }
              const tokenInfo = {
                token: data.token.idToken,
                expires_at: data.token.expiresAt
              }
              // dbに新規ユーザー登録
              await createUser({
                email,
                password,
                name,
                token_info: tokenInfo
              })

              // jwt()コールバックのaccount引き数に渡される。
              // jwt()後はtokenをクッキーにセットして、設定されているpathにredirectさせる。
              return {
                email,
              };
            } catch (e) {
              console.error(e);
              // nullを返すと、signIn()関数がエラーを投げ、AuthErrorクラスのインスタンスが返る。
              return null;
            }

          }
        }
        // zodでバリデーションに引っかかった場合はnullを返す。
        return null;
      }
    })],

});

export async function getUserFromSession(): Promise<DBUser> {
  try {
    // auth()が呼ばれると、まずjwt()が呼ばれる。jwt()によりcookieのjwtが更新され、tokenオブジェクトが更新される。
    // 次にsession()が呼ばれる。session()により、tokenオブジェクトの情報をsessionオブジェクトにセットする。
    // その結果がauth()の戻り値になる。
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
