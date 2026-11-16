import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { readDictionary, writeDictionary } from "@/lib/getData";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const en = readDictionary("en");
  const fr = readDictionary("fr");
  return NextResponse.json({ en: en.direction.members, fr: fr.direction.members });
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const { en: enMembers, fr: frMembers } = await req.json();
  const en = readDictionary("en");
  const fr = readDictionary("fr");
  en.direction.members = enMembers;
  fr.direction.members = frMembers;
  writeDictionary("en", en);
  writeDictionary("fr", fr);
  return NextResponse.json({ ok: true });
}
