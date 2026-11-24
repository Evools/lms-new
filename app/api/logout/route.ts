import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  const res = NextResponse.redirect(loginUrl);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");

  const allCookies = req.cookies.getAll();
  for (const cookie of allCookies) {
    if (
      cookie.name.includes("authjs") ||
      cookie.name.includes("next-auth") ||
      cookie.name === "lms_google_link_uid"
    ) {
      const isSecureCookie =
        cookie.name.startsWith("__Secure-") ||
        cookie.name.startsWith("__Host-") ||
        loginUrl.protocol === "https:";

      res.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly: !cookie.name.includes("callback-url"),
        sameSite: "lax",
        secure: isSecureCookie,
      });
    }
  }

  return res;
}
