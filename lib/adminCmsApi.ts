import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { CmsRevisionConflictError, getCmsCollectionPage, saveCmsCollection } from "@/lib/cmsRepository";
import type { CmsCollectionKey } from "@/lib/cmsSchemas";

export async function getAdminCollection(req: NextRequest, key: CmsCollectionKey) {
  if (!isAuthenticated(req)) return unauthorized();
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "100");
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 500) {
    return NextResponse.json({ error: "Invalid pagination. Use page >= 1 and pageSize between 1 and 500." }, { status: 400 });
  }
  try {
    const revisionHeader = req.headers.get("if-match");
    const revisionMatch = revisionHeader?.match(/^"?(\d+)"?$/);
    const snapshot = await getCmsCollectionPage(key, page, pageSize, revisionMatch ? Number(revisionMatch[1]) : undefined);
    return NextResponse.json({ data: snapshot.data, pagination: snapshot.pagination }, {
      headers: {
        "Cache-Control": "no-store",
        ETag: `"${snapshot.revision}"`,
        "X-CMS-Revision": String(snapshot.revision),
      },
    });
  } catch (error) {
    if (error instanceof CmsRevisionConflictError) {
      return NextResponse.json({ error: error.message, currentRevision: error.currentRevision }, { status: 409 });
    }
    console.error(`CMS collection read failed (${key})`, error);
    return NextResponse.json({ error: "CMS database is unavailable or has not been initialized" }, { status: 503 });
  }
}

export async function putAdminCollection(req: NextRequest, key: CmsCollectionKey) {
  if (!isAuthenticated(req)) return unauthorized();
  let payload: unknown;
  try {
    const revisionHeader = req.headers.get("if-match");
    const revisionMatch = revisionHeader?.match(/^"?(\d+)"?$/);
    if (!revisionMatch) {
      return NextResponse.json({ error: "A current CMS revision is required to save." }, { status: 428 });
    }
    payload = await req.json();
    const saved = await saveCmsCollection(key, payload, Number(revisionMatch[1]));
    return NextResponse.json({ ok: true, ...saved }, {
      headers: {
        "Cache-Control": "no-store",
        ETag: `"${saved.revision}"`,
        "X-CMS-Revision": String(saved.revision),
      },
    });
  } catch (error) {
    if (error instanceof CmsRevisionConflictError) {
      return NextResponse.json({ error: error.message, currentRevision: error.currentRevision }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid CMS content", issues: error.issues }, { status: 400 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    console.error(`CMS collection write failed (${key})`, error);
    return NextResponse.json({ error: "Could not save CMS content" }, { status: 503 });
  }
}
