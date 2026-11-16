import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { readData, writeData } from "@/lib/getData";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  return NextResponse.json(readData("publications.json"));
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const data = await req.json();
  writeData("publications.json", data);
  return NextResponse.json({ ok: true });
}
