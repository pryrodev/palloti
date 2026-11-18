import { NextRequest, NextResponse } from "next/server";
import { getCmsCollectionPage } from "@/lib/cmsRepository";
import { readPublishedData } from "@/lib/getData";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "6");
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return NextResponse.json({ error: "Invalid pagination. Use page >= 1 and pageSize between 1 and 100." }, { status: 400 });
  }

  try {
    if (process.env.DATABASE_URL) {
      const result = await getCmsCollectionPage("publications", page, pageSize);
      return NextResponse.json({ items: result.data, pagination: result.pagination }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    // Preserve the static-data fallback when a database is not configured or available.
  }

  const publications = await readPublishedData<unknown[]>("publications", "publications.json");
  const offset = (page - 1) * pageSize;
  const total = publications.length;
  return NextResponse.json({
    items: publications.slice(offset, offset + pageSize),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), offset },
  }, { headers: { "Cache-Control": "no-store" } });
}
