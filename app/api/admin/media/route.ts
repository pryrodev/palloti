import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const assetSchema = z.object({
  publicId: z.string().min(1).max(191),
  url: z.string().url().max(2048),
  secureUrl: z.string().url().max(2048),
  resourceType: z.enum(["image", "video", "raw"]),
  format: z.string().max(32).optional(),
  bytes: z.number().int().nonnegative().max(2_147_483_647).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  try {
    const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(assets, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Media database is unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const parsed = assetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid media metadata", issues: parsed.error.issues }, { status: 400 });
  try {
    const asset = await prisma.mediaAsset.upsert({
      where: { publicId: parsed.data.publicId },
      create: parsed.data,
      update: parsed.data,
    });
    return NextResponse.json(asset);
  } catch {
    return NextResponse.json({ error: "Could not save media metadata" }, { status: 503 });
  }
}
