import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies: false,
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const rawIdentifier = (credentials.email as string).trim();
        const password = credentials.password as string;

        if (!rawIdentifier || !password) {
          return null;
        }

        // 1. Try finding by email
        let user = await prisma.user.findUnique({
          where: { email: rawIdentifier.toLowerCase() },
        });

        // 2. If not found by direct email, try finding by phone number or case-insensitive search
        if (!user) {
          const rawDigits = rawIdentifier.replace(/\D/g, "");
          if (rawDigits.length >= 6) {
            // Extract significant national number (last 9 digits, e.g. 703070029)
            const significantInput = rawDigits.length >= 9 ? rawDigits.slice(-9) : rawDigits;

            const candidates = await prisma.user.findMany({
              where: {
                phone: { not: null },
              },
            });

            user = candidates.find((u) => {
              if (!u.phone) return false;
              const uDigits = u.phone.replace(/\D/g, "");
              const significantDb = uDigits.length >= 9 ? uDigits.slice(-9) : uDigits;

              return (
                uDigits === rawDigits ||
                uDigits.endsWith(rawDigits) ||
                rawDigits.endsWith(uDigits) ||
                significantDb === significantInput
              );
            }) || null;
          }
        }

        if (!user) {
          user = await prisma.user.findFirst({
            where: {
              email: {
                equals: rawIdentifier,
                mode: "insensitive",
              },
            },
          });
        }

        if (!user || !user.isActive || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.avatar = token.avatar as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
