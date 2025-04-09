import { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // authorized()は、middlewareで自動で呼び出されるコールバック
    // authorized()が呼ばれる前に、自動でjwt()→session()の順で呼び出される
    // jwt()は、リクエストからjwt payload(tokenオブジェクト)を取得し、プロパティの更新をする。
    // session()は、jwt()からjwt payload(tokenオブジェクト)を取得し、必要な情報をsessionオブジェクトにセットする。
    // authorized()は、session()からsessionオブジェクトを取得し、必要な情報を取得する。
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth && !!(auth.user?.email);
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      } else{
        return Response.redirect(new URL("/login", nextUrl));
      }
    },
    // jwt(), session()を省略しても、NextAuthは内部でデフォルトのjwt(), session()を呼び出す
    // デフォルトのjwt()では、初回ログイン時(userプロパティが存在する時)、token.nameやtoken.email, token.expなどを自動でセットし、tokenオブジェクトをreturnする。
    // （もちろんレスポンスのset-Cookieにもjwtを保存する）
    // 2回目以降は、jwtペイロードの中身をそのままtokenオブジェクトとしてreturnする。
    // デフォルトのsession()では、jwt()がreturnするtokenをもとに、session.userにemailやnameなどをセットする。
    // jwt()が返すtokenはフラットだが、session()ではユーザー情報をsession.userに、expなどの情報をsession.expiresに分別する。
    
  },
  providers: [],
} satisfies NextAuthConfig;

export const { auth, signIn, signOut } = NextAuth(authConfig);

