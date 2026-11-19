import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function isAdminSession(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  return session?.user.role === "admin" && session.user.banned !== true;
}

export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const session = await auth.api.getSession({ headers: req.headers });
  return isAdminSession(session);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function checkAdminSession(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return isAdminSession(session);
}
