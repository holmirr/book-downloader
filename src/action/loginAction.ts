"use server";

import { signIn } from "@/auth/auth";
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
    }
    throw error;

  }
}

