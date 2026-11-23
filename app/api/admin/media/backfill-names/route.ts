import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60; // allow up to 60s for large libraries

/**
 * POST /api/admin/media/backfill-names
 *
 * Fetches every MediaAsset that has no `name`, queries the Cloudinary Admin API
 * for each asset's `original_filename`, and writes it back to the database.
 * Safe to call multiple times — only touches rows with name IS NULL.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      { error: "Cloudinary is not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET." },
      { status: 503 },
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // 1. Find all assets that still have no name — use raw SQL so this works
  //    even before the migration adds the column (the column defaults to NULL).
  let assets: { id: string; publicId: string | null; resourceType: string }[];
  try {
    assets = await prisma.$queryRaw<{ id: string; publicId: string | null; resourceType: string }[]>`
      SELECT id, publicId, resourceType FROM media_assets
      WHERE (name IS NULL OR name = '') AND publicId IS NOT NULL
    `;
  } catch {
    return NextResponse.json({ error: "Database is unavailable." }, { status: 503 });
  }

  if (assets.length === 0) {
    return NextResponse.json({ updated: 0, message: "All assets already have names." });
  }

  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  // 2. For each asset, call Cloudinary Admin API and update the DB row
  for (const asset of assets) {
    if (!asset.publicId) continue;

    try {
      // Map our resourceType to Cloudinary's resource_type param
      const resourceType =
        asset.resourceType === "video" ? "video"
        : asset.resourceType === "raw" ? "raw"
        : "image";

      // Cloudinary returns `original_filename` (without extension) for uploaded files
      const info = await cloudinary.api.resource(asset.publicId, {
        resource_type: resourceType,
      }) as Record<string, unknown>;

      // Build a readable name: prefer original_filename + format, fall back to public_id segment
      const originalFilename = typeof info.original_filename === "string" && info.original_filename.trim()
        ? info.original_filename.trim()
        : null;
      const format = typeof info.format === "string" ? info.format : null;
      const name = originalFilename
        ? (format ? `${originalFilename}.${format}` : originalFilename)
        : (asset.publicId.split("/").pop() ?? asset.publicId);

      await prisma.$executeRaw`
        UPDATE media_assets SET name = ${name.slice(0, 255)} WHERE id = ${asset.id}
      `;
      updated++;
    } catch (err) {
      failed++;
      errors.push(`${asset.publicId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    total: assets.length,
    updated,
    failed,
    ...(errors.length > 0 ? { errors: errors.slice(0, 20) } : {}),
  });
}
