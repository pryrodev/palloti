import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSession } from "@/lib/adminAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024),
});

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(req: NextRequest) {
  const input = loginSchema.safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "A valid email and password are required" }, { status: 400 });
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const session = createAdminSession();
  if (!email || !password || !session) return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  if (constantTimeEqual(input.data.email.trim().toLowerCase(), email) && constantTimeEqual(input.data.password, password)) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_auth", session, { httpOnly: true, path: "/", maxAge: 60 * 60 * 8, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    return res;
  }
  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_auth");
  return res;
}
