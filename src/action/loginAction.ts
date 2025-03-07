"use server";

import { signIn, AuthorizationError, signOut } from "@/auth/auth";
import { AuthError } from "next-auth";
export async function login(prevState: { message: string } | undefined, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      console.log(error);
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "メールアドレスかパスワードが間違っています" };
        default:
          return { message: "ログインに失敗しました" };
      }
    } else if (error instanceof AuthorizationError) {
      return { message: "権限がありません" };
    }
    throw error;

  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
  return null;
}
