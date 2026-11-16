import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { readData, writeData } from "@/lib/getData";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  return NextResponse.json(readData("videos.json"));
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const data = await req.json();
  writeData("videos.json", data);
  return NextResponse.json({ ok: true });
}
