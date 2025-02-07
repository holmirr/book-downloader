
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
    async authorize(credentials) {
      const parsedCredentials = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(credentials);
      if (parsedCredentials.success) {
        const { email, password } = parsedCredentials.data;
        console.log(email, password);
        if (email === "test@test.com" && password === "password") {
          console.log("ログイン成功");
          return { id: "1", name: "Test User" };
        }
      }
      return null;
    }
  })],

});


