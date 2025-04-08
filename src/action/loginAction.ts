"use server";

import { signIn, AuthorizationError, signOut } from "@/auth/auth";
import { AuthError } from "next-auth";

export async function login(prevState: { message: string } | undefined, formData: FormData) {
  try {
    // formDataがauth.tsのcredentialsのauthorizeコールバックの引き数に渡される。
    // authorize()が成功→jwt()→クッキーにjwtをセットしてリダイレクト
    await signIn("credentials", formData);
  } catch (error) {
    // signIn()のredirectはエラーをthrowして実行されるので、パスさせなければならない
    // 認証時の純粋なエラーはAuthErrorのみ
    // 認証時のauthorize()関数内でAuthorizationErrorクラスを作成し、インスタンスをthrowしている
    if (error instanceof AuthError) {
      console.log(error);
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "メールアドレスかパスワードが間違っています" };
        default:
          return { message: "ログインに失敗しました" };
      }
    } else if (error instanceof AuthorizationError) {
      // databaseのuserテーブルに存在しない場合は、そもそもの権限がない。
      return { message: "権限がありません" };
    }
    throw error;
  }
}

export async function logout() {
  // jwtを削除してリダイレクト
  await signOut({ redirectTo: "/login" });
  return null;
}
