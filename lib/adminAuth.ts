import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

function expectedSessionToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update("pallotti-cms-admin").digest("hex");
}

function validSession(token?: string) {
  const expected = expectedSessionToken();
  if (!expected || !token) return false;
  const actualBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isAuthenticated(req: NextRequest): boolean {
  return validSession(req.cookies.get("admin_auth")?.value);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function checkAdminCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return validSession(cookieStore.get("admin_auth")?.value);
}

export function createAdminSession() {
  return expectedSessionToken();
}
