"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const identifier = ((formData.get("identifier") || formData.get("email")) as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Заполните все поля" };
  }

  try {
    await signIn("credentials", {
      email: identifier,
      password,
      redirectTo: "/dashboard",
    });
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
    // Next.js redirect errors need to be rethrown
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
