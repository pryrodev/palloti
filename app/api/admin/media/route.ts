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
  if (!(await isAuthenticated(req))) return unauthorized();
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "24");
  const resourceType = req.nextUrl.searchParams.get("resourceType");
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return NextResponse.json({ error: "Invalid pagination. Use page >= 1 and pageSize between 1 and 100." }, { status: 400 });
  }
  if (resourceType && !["image", "video", "raw"].includes(resourceType)) {
    return NextResponse.json({ error: "Invalid media resource type." }, { status: 400 });
  }
  const where = resourceType ? { resourceType } : undefined;
  try {
    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.mediaAsset.count({ where }),
    ]);
    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        offset: (page - 1) * pageSize,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Media database is unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
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
