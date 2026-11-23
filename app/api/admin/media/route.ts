import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { prisma, ensureMediaNameColumn } from "@/lib/prisma";

const assetSchema = z.object({
  publicId: z.string().min(1).max(191),
  name: z.string().max(255).optional(),
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
  await ensureMediaNameColumn();
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
  } catch (err) {
    console.error("GET /api/admin/media error, attempting fallback query:", err);
    try {
      const offset = (page - 1) * pageSize;
      const typeFilter = resourceType ? `WHERE resourceType = '${resourceType}'` : "";
      const items = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT id, publicId, url, secureUrl, resourceType, format, bytes, width, height, createdAt FROM media_assets ${typeFilter} ORDER BY createdAt DESC, id DESC LIMIT ${pageSize} OFFSET ${offset}`
      );
      const countResult = await prisma.$queryRawUnsafe<{ count: number | bigint }[]>(
        `SELECT COUNT(*) as count FROM media_assets ${typeFilter}`
      );
      const total = Number(countResult[0]?.count ?? 0);
      return NextResponse.json({
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          offset,
        },
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (fallbackErr) {
      console.error("GET /api/admin/media fallback error:", fallbackErr);
      return NextResponse.json({ error: err instanceof Error ? err.message : "Media database is unavailable" }, { status: 503 });
    }
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  const parsed = assetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid media metadata", issues: parsed.error.issues }, { status: 400 });
  try {
    await ensureMediaNameColumn();
    const { name, ...rest } = parsed.data;
    // Upsert without `name` — Prisma client on main may not have this field yet.
    const asset = await prisma.mediaAsset.upsert({
      where: { publicId: rest.publicId },
      create: { ...rest },
      update: { ...rest },
    });
    // Patch name via raw SQL so it works regardless of generated client version.
    if (name) {
      await prisma.$executeRaw`UPDATE media_assets SET name = ${name.slice(0, 255)} WHERE id = ${asset.id}`;
    }
    return NextResponse.json({ ...asset, name: name ?? null });
  } catch {
    return NextResponse.json({ error: "Could not save media metadata" }, { status: 503 });
  }
}

const renameSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
});

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  const parsed = renameSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid name. Name must be between 1 and 255 characters." }, { status: 400 });
  try {
    await ensureMediaNameColumn();
    await prisma.$executeRaw`
      UPDATE media_assets SET name = ${parsed.data.name.trim().slice(0, 255)} WHERE id = ${parsed.data.id}
    `;
    return NextResponse.json({ success: true, id: parsed.data.id, name: parsed.data.name.trim() });
  } catch (err) {
    console.error("PATCH /api/admin/media error:", err);
    return NextResponse.json({ error: "Could not rename asset" }, { status: 500 });
  }
}
