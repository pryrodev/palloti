import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { getAdminCollection, putAdminCollection } from "@/lib/adminCmsApi";
import { addGalleryItems, CmsRevisionConflictError, deleteGalleryItem, updateGalleryPageItems } from "@/lib/cmsRepository";

function expectedRevision(req: NextRequest) {
  const match = req.headers.get("if-match")?.match(/^\"?(\d+)\"?$/);
  return match ? Number(match[1]) : null;
}

export async function GET(req: NextRequest) {
  return getAdminCollection(req, "gallery");
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  try {
    const body = await req.json();
    const photos = Array.isArray(body.photos) ? body.photos : body.photo ? [body.photo] : [];
    if (photos.length === 0) return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    const result = await addGalleryItems(photos);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Failed to add gallery photos", err);
    return NextResponse.json({ error: "Could not add photos" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  const revision = expectedRevision(req);
  if (revision === null) return NextResponse.json({ error: "A current gallery revision is required." }, { status: 428 });
  try {
    const body = await req.json();
    const result = await deleteGalleryItem({ index: body.index, src: body.src, expectedRevision: revision });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof CmsRevisionConflictError) return NextResponse.json({ error: err.message, currentRevision: err.currentRevision }, { status: 409 });
    console.error("Failed to delete gallery photo", err);
    return NextResponse.json({ error: "Could not delete photo" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  const revision = expectedRevision(req);
  if (revision === null) return NextResponse.json({ error: "A current gallery revision is required." }, { status: 428 });
  try {
    const body = await req.json();
    const page = Number(body.page ?? 1);
    const pageSize = Number(body.pageSize ?? 24);
    const items = Array.isArray(body.items) ? body.items : [];
    const result = await updateGalleryPageItems({ page, pageSize, items, expectedRevision: revision });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof CmsRevisionConflictError) return NextResponse.json({ error: err.message, currentRevision: err.currentRevision }, { status: 409 });
    console.error("Failed to update gallery page items", err);
    return NextResponse.json({ error: "Could not update gallery items" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return putAdminCollection(req, "gallery");
}
