import { cache } from "react";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function isAdminSession(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session?.user.role === "admin" && session.user.banned !== true;
}

// In-memory cache for verified session tokens to prevent 1-2s database round-trips
// on every single admin API and RSC navigation request.
const sessionCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();
const SESSION_CACHE_TTL_MS = 60_000;

function getCookieToken(headersOrReq: Headers | NextRequest): string | undefined {
  if ("cookies" in headersOrReq && typeof headersOrReq.cookies?.get === "function") {
    return headersOrReq.cookies.get("better-auth.session_token")?.value
      ?? headersOrReq.cookies.get("__Secure-better-auth.session_token")?.value;
  }
  const cookieStr = typeof (headersOrReq as Headers).get === "function"
    ? (headersOrReq as Headers).get("cookie") ?? ""
    : "";
  const match = cookieStr.match(/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = getCookieToken(req);
  if (token) {
    const cached = sessionCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.isAdmin;
    }
  }

  const session = await auth.api.getSession({ headers: req.headers });
  const isAdmin = isAdminSession(session);
  if (token && isAdmin) {
    if (sessionCache.size > 200) sessionCache.clear();
    sessionCache.set(token, { isAdmin, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
  }
  return isAdmin;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// cache() deduplicates calls within the same server request; sessionCache shares
// verification across requests on the same instance for 60 seconds.
export const checkAdminSession = cache(async function checkAdminSession(): Promise<boolean> {
  const reqHeaders = await headers();
  const token = getCookieToken(reqHeaders);
  if (token) {
    const cached = sessionCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.isAdmin;
    }
  }

  const session = await auth.api.getSession({ headers: reqHeaders });
  const isAdmin = isAdminSession(session);
  if (token && isAdmin) {
    if (sessionCache.size > 200) sessionCache.clear();
    sessionCache.set(token, { isAdmin, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
  }
  return isAdmin;
});
