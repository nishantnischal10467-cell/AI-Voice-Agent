import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [],
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
});
