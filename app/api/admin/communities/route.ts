import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { readDictionary, writeDictionary } from "@/lib/getData";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const en = readDictionary("en");
  const fr = readDictionary("fr");
  return NextResponse.json({ en: en.communities.items, fr: fr.communities.items });
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const { en: enItems, fr: frItems } = await req.json();
  const en = readDictionary("en");
  const fr = readDictionary("fr");
  en.communities.items = enItems;
  fr.communities.items = frItems;
  writeDictionary("en", en);
  writeDictionary("fr", fr);
  return NextResponse.json({ ok: true });
}
