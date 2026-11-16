import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export function isAuthenticated(req: NextRequest): boolean {
  return req.cookies.get("admin_auth")?.value === "1";
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function checkAdminCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}
