import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { getAdminCollection, putAdminCollection } from "@/lib/adminCmsApi";
import { addGalleryItems, deleteGalleryItem, updateGalleryPageItems } from "@/lib/cmsRepository";

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
  try {
    const body = await req.json();
    const result = await deleteGalleryItem({ index: body.index, src: body.src });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Failed to delete gallery photo", err);
    return NextResponse.json({ error: "Could not delete photo" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  try {
    const body = await req.json();
    const page = Number(body.page ?? 1);
    const pageSize = Number(body.pageSize ?? 24);
    const items = Array.isArray(body.items) ? body.items : [];
    const result = await updateGalleryPageItems({ page, pageSize, items });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Failed to update gallery page items", err);
    return NextResponse.json({ error: "Could not update gallery items" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return putAdminCollection(req, "gallery");
}
