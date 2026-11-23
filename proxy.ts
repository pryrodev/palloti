import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "./i18n.config";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const locales = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages().filter((language) => {
    try {
      return language !== "*" && Intl.getCanonicalLocales(language).length > 0;
    } catch {
      return false;
    }
  });
  return matchLocale(languages.length > 0 ? languages : [i18n.defaultLocale], locales, i18n.defaultLocale);
}

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all /admin routes except /admin/login at the proxy edge
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname !== "/admin/login" && !pathname.startsWith("/admin/login") && !hasSessionCookie(request)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return;
  }

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|videos/|.*\\.png$|.*\\.jpg$|.*\\.jpeg$).*)" ],
};
