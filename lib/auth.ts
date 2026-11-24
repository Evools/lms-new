import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
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
              OR: [
                { email: { equals: rawIdentifier, mode: "insensitive" } },
                { email: { startsWith: rawIdentifier, mode: "insensitive" } },
                { name: { equals: rawIdentifier, mode: "insensitive" } },
                { name: { contains: rawIdentifier, mode: "insensitive" } },
              ],
            },
          });
        }

        if (!user || !user.isActive || !user.password) {
          return null;
        }

        const isPasswordValid =
          (await bcrypt.compare(password, user.password)) ||
          (password.trim() !== password && (await bcrypt.compare(password.trim(), user.password))) ||
          Boolean(user.tempPassword && (password === user.tempPassword || password.trim() === user.tempPassword));

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
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      const googleId = account.providerAccountId;
      const googleEmail =
        (user.email || (typeof profile?.email === "string" ? profile.email : "") || "")
          .trim()
          .toLowerCase() || null;

      if (!googleId) {
        return "/login?error=GoogleAuthFailed";
      }

      try {
        const cookieStore = await cookies();
        const linkUserId = cookieStore.get("lms_google_link_uid")?.value;

        if (linkUserId) {
          cookieStore.delete("lms_google_link_uid");

          const currentUser = await prisma.user.findUnique({
            where: { id: linkUserId },
          });
          if (!currentUser || !currentUser.isActive) {
            return "/login?error=AccountInactive";
          }

          const existingOwner = await prisma.user.findUnique({
            where: { googleId },
            select: { id: true },
          });
          if (existingOwner && existingOwner.id !== linkUserId) {
            return "/dashboard/profile?googleError=already_linked";
          }

          const updatedUser = await prisma.user.update({
            where: { id: linkUserId },
            data: {
              googleId,
              googleEmail,
            },
          });

          user.id = updatedUser.id;
          user.role = updatedUser.role;
          user.avatar = updatedUser.avatar;
          user.name = updatedUser.name;
          user.email = updatedUser.email;
          return true;
        }

        const dbUser = await prisma.user.findUnique({
          where: { googleId },
        });

        if (!dbUser) {
          return "/login?error=GoogleNotLinked";
        }

        if (!dbUser.isActive) {
          return "/login?error=AccountInactive";
        }

        user.id = dbUser.id;
        user.role = dbUser.role;
        user.avatar = dbUser.avatar;
        user.name = dbUser.name;
        user.email = dbUser.email;
        return true;
      } catch (err) {
        console.error("[auth][google] signIn callback error:", err);
        return "/login?error=GoogleAuthFailed";
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string) || "";
        session.user.role = token.role as Role;
        session.user.avatar = token.avatar as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
