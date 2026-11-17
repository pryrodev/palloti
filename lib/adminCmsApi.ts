import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { getCmsCollection, saveCmsCollection } from "@/lib/cmsRepository";
import type { CmsCollectionKey } from "@/lib/cmsSchemas";

export async function getAdminCollection(req: NextRequest, key: CmsCollectionKey) {
  if (!isAuthenticated(req)) return unauthorized();
  try {
    const payload = await getCmsCollection(key);
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(`CMS collection read failed (${key})`, error);
    return NextResponse.json({ error: "CMS database is unavailable or has not been initialized" }, { status: 503 });
  }
}

export async function putAdminCollection(req: NextRequest, key: CmsCollectionKey) {
  if (!isAuthenticated(req)) return unauthorized();
  let payload: unknown;
  try {
    payload = await req.json();
    const saved = await saveCmsCollection(key, payload);
    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid CMS content", issues: error.issues }, { status: 400 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    console.error(`CMS collection write failed (${key})`, error);
    return NextResponse.json({ error: "Could not save CMS content" }, { status: 503 });
  }
}
