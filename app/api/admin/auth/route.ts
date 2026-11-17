import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSession } from "@/lib/adminAuth";
import { z } from "zod";

const loginSchema = z.object({ password: z.string().min(1).max(1024) });

export async function POST(req: NextRequest) {
  const input = loginSchema.safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Password is required" }, { status: 400 });
  const password = process.env.ADMIN_PASSWORD;
  const session = createAdminSession();
  if (!password || !session) return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  const provided = Buffer.from(input.data.password);
  const configured = Buffer.from(password);
  if (provided.length === configured.length && timingSafeEqual(provided, configured)) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_auth", session, { httpOnly: true, path: "/", maxAge: 60 * 60 * 8, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_auth");
  return res;
}
