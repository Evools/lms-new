"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "authjs.session-token.0",
  "authjs.session-token.1",
  "authjs.session-token.2",
  "authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.session-token",
  "__Secure-authjs.session-token.0",
  "__Secure-authjs.session-token.1",
  "__Secure-authjs.callback-url",
  "__Host-authjs.csrf-token",
  "next-auth.session-token",
  "next-auth.session-token.0",
  "next-auth.session-token.1",
  "next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.session-token",
];

async function clearAllAuthCookies() {
  try {
    const cookieStore = await cookies();
    for (const name of AUTH_COOKIE_NAMES) {
      cookieStore.set(name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
      cookieStore.delete(name);
    }
  } catch {
    // ignore
  }
}

export async function loginAction(formData: FormData) {
  const identifier = ((formData.get("identifier") || formData.get("email")) as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Заполните все поля" };
  }

  try {
    const res = await signIn("credentials", {
      email: identifier,
      password,
      redirect: false,
    });

    if (typeof res === "string" && (res.includes("error=CredentialsSignin") || res.includes("error="))) {
      return { error: "Неверный логин или пароль" };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Неверный логин или пароль" };
        default:
          return { error: "Ошибка авторизации. Попробуйте еще раз." };
      }
    }
    if ((error as Error)?.message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "Ошибка авторизации. Попробуйте еще раз." };
  }
}

export async function logoutAction() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    if (!(error as Error)?.message?.includes("NEXT_REDIRECT")) {
      // ignore
    }
  }

  await clearAllAuthCookies();
  return { success: true };
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
