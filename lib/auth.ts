import { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

interface ExtendedUser extends User {
  role?: string;
  onboarded?: boolean;
}

interface ExtendedToken extends JWT {
  role?: string;
  onboarded?: boolean;
}

interface ExtendedSession extends Session {
  user: {
    id?: string;
    role?: string;
    onboarded?: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "quantum-secret-key-for-prod-32chars!",
  pages: {
    signIn: "/auth/signin",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboarded: user.onboarded,
        } as ExtendedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;
        token.id = u.id;
        token.role = u.role;
        token.onboarded = u.onboarded;
      }
      return token as ExtendedToken;
    },
    async session({ session, token }) {
      const extToken = token as ExtendedToken;
      const extSession = session as ExtendedSession;
      if (extToken && extSession.user) {
        extSession.user.id = extToken.sub;
        extSession.user.role = extToken.role;
        extSession.user.onboarded = extToken.onboarded;
      }
      return extSession;
    },
  },
};
