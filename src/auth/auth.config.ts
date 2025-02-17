import { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth;
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
  },
  providers: [],
} satisfies NextAuthConfig;

export const { auth, signIn, signOut } = NextAuth(authConfig);

