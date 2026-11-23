import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { prisma, ensureMediaNameColumn } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60; // allow up to 60s for large libraries

type AssetRow = {
  id: string;
  publicId: string | null;
  resourceType: string;
  format: string | null;
  secureUrl: string | null;
};

/**
 * Tries multiple permutations to resolve an asset from Cloudinary Admin API.
 * Cloudinary stores raw files with extensions (e.g. `doc.pdf`) and image files without (`doc`).
 */
async function resolveCloudinaryOriginalFilename(
  publicId: string,
  resourceType: string,
  format?: string | null,
  secureUrl?: string | null
): Promise<{ originalFilename: string | null; format: string | null }> {
  // Extract public ID candidates from publicId and secureUrl
  let urlPublicId: string | null = null;
  if (secureUrl) {
    try {
      const parsed = new URL(secureUrl);
      const uploadIdx = parsed.pathname.indexOf("/upload/");
      if (uploadIdx !== -1) {
        urlPublicId = decodeURIComponent(parsed.pathname.slice(uploadIdx + 8).replace(/^v\d+\//, ""));
      }
    } catch {}
  }

  const baseId = publicId.replace(/\.[^/.]+$/, "");
  const ext = format || (publicId.includes(".") ? publicId.split(".").pop() : "pdf");

  const candidates: { id: string; type: "image" | "raw" | "video" }[] = [
    { id: publicId, type: resourceType === "video" ? "video" : resourceType === "raw" ? "raw" : "image" },
  ];

  if (resourceType === "raw" && ext && !publicId.endsWith(`.${ext}`)) {
    candidates.push({ id: `${publicId}.${ext}`, type: "raw" });
  }
  // Cloudinary often handles PDFs as resource_type: "image"
  candidates.push({ id: baseId, type: "image" });
  if (urlPublicId && urlPublicId !== publicId) {
    candidates.push({ id: urlPublicId, type: "raw" });
    candidates.push({ id: urlPublicId.replace(/\.[^/.]+$/, ""), type: "image" });
  }

  for (const candidate of candidates) {
    try {
      const res = await cloudinary.api.resource(candidate.id, {
        resource_type: candidate.type,
      }) as Record<string, unknown>;

      if (res) {
        const origName = typeof res.original_filename === "string" && res.original_filename.trim()
          ? res.original_filename.trim()
          : null;
        const fmt = typeof res.format === "string" ? res.format : format ?? null;
        return { originalFilename: origName, format: fmt };
      }
    } catch {
      // Continue trying candidates
    }
  }

  return { originalFilename: null, format: format ?? null };
}

/**
 * Derives a clean, readable name for an asset when Cloudinary does not have `original_filename`.
 */
function deriveFriendlyFallback(asset: AssetRow, index: number): string {
  const ext = asset.format || (asset.resourceType === "raw" ? "pdf" : "jpg");

  // Check if secureUrl has a meaningful filename
  if (asset.secureUrl) {
    try {
      const pathname = new URL(asset.secureUrl).pathname;
      const lastSeg = pathname.split("/").pop();
      if (lastSeg) {
        const decoded = decodeURIComponent(lastSeg);
        // If not a purely random 20+ char hex/alphanumeric hash
        if (!decoded.match(/^[a-f0-9]{20,}/i) && !decoded.match(/^drive-[a-z0-9_-]{20,}/i)) {
          return decoded.slice(0, 255);
        }
      }
    } catch {}
  }

  const shortId = asset.publicId?.split("/").pop()?.slice(0, 8) || String(index + 1);
  const typeLabel = asset.resourceType === "raw" ? "Document" : asset.resourceType === "video" ? "Video" : "Image";
  return `${typeLabel}-${shortId}.${ext}`;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured." },
      { status: 503 },
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  await ensureMediaNameColumn();
  let assets: AssetRow[] = [];
  try {
    assets = await prisma.$queryRaw<AssetRow[]>`
      SELECT id, publicId, resourceType, format, secureUrl
      FROM media_assets
      WHERE (name IS NULL OR name = '') AND publicId IS NOT NULL
    `;
  } catch (err) {
    console.warn("Could not filter by name column, selecting all assets:", err);
    try {
      assets = await prisma.$queryRaw<AssetRow[]>`
        SELECT id, publicId, resourceType, format, secureUrl
        FROM media_assets
        WHERE publicId IS NOT NULL
      `;
    } catch (fallbackErr) {
      console.error("backfill-names query error:", fallbackErr);
      return NextResponse.json(
        { error: fallbackErr instanceof Error ? fallbackErr.message : "Database is unavailable." },
        { status: 503 },
      );
    }
  }

  if (assets.length === 0) {
    return NextResponse.json({ updated: 0, message: "All assets already have names." });
  }

  let updated = 0;
  let fromCloudinary = 0;
  let fromFallback = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    if (!asset.publicId) continue;

    try {
      const { originalFilename, format } = await resolveCloudinaryOriginalFilename(
        asset.publicId,
        asset.resourceType,
        asset.format,
        asset.secureUrl
      );

      let name: string;
      if (originalFilename) {
        name = format ? `${originalFilename}.${format}` : originalFilename;
        fromCloudinary++;
      } else {
        name = deriveFriendlyFallback(asset, i);
        fromFallback++;
      }

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
    fromCloudinary,
    fromFallback,
    failed,
    ...(errors.length > 0 ? { errors: errors.slice(0, 5) } : {}),
  });
}
