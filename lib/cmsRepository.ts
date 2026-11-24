import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cmsSchemas, type CmsCollectionKey, type CmsPayload } from "@/lib/cmsSchemas";
import { cmsRecordsFor } from "@/lib/cmsRecords";
import { revalidateTag, unstable_cache } from "next/cache";

function cmsCollectionCacheTag(key: CmsCollectionKey) {
  return `cms-collection:${key}`;
}

function invalidateCmsCollectionCache(key: CmsCollectionKey) {
  revalidateTag(cmsCollectionCacheTag(key), { expire: 0 });
}

export class CmsRevisionConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super("CMS content changed since it was loaded. Reload before saving again.");
    this.name = "CmsRevisionConflictError";
  }
}

export async function getCmsCollectionSnapshot<K extends CmsCollectionKey>(key: K): Promise<{
  payload: CmsPayload<K>;
  revision: number;
  updatedAt: Date;
}> {
  const collection = await prisma.cmsCollection.findUnique({
    where: { key },
    select: { payload: true, revision: true, updatedAt: true },
  });
  if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
  return {
    payload: cmsSchemas[key].parse(collection.payload) as CmsPayload<K>,
    revision: collection.revision,
    updatedAt: collection.updatedAt,
  };
}

export async function getCmsCollection<K extends CmsCollectionKey>(key: K): Promise<CmsPayload<K>> {
  const readCachedCollection = unstable_cache(
    async () => {
      const collection = await prisma.cmsCollection.findUnique({ where: { key }, select: { payload: true } });
      if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
      return cmsSchemas[key].parse(collection.payload) as CmsPayload<K>;
    },
    ["public-cms-collection-v2", key],
    { tags: [cmsCollectionCacheTag(key)], revalidate: 300 },
  );
  return readCachedCollection();
}

export type CmsPageInfo = { page: number; pageSize: number; total: number; totalPages: number; offset: number };
export type CmsCollectionPage = {
  data: unknown;
  pagination: CmsPageInfo | { en: CmsPageInfo; fr: CmsPageInfo; it?: CmsPageInfo };
  revision: number;
};

function pageInfo(page: number, pageSize: number, total: number): CmsPageInfo {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize), offset: (page - 1) * pageSize };
}

export async function getCmsCollectionPage(
  key: CmsCollectionKey,
  page: number,
  pageSize: number,
  expectedRevision?: number,
): Promise<CmsCollectionPage> {
  // The historical catalog was added after existing databases were seeded.
  // Initialize its empty collection lazily so the admin can load before the
  // next full seed run, without affecting any existing catalog records.
  if (key === "catalog") {
    await prisma.cmsCollection.upsert({
      where: { key },
      create: { key, payload: [] },
      update: {},
    });
  }
  // Reads must not hold an interactive transaction open while doing paginated
  // queries. Prisma serializes queries on a transaction connection, and its
  // default interactive transaction timeout is five seconds. The revision
  // check below gives us a consistent view without that long-lived transaction.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (key === "siteContent") {
      const collection = await prisma.cmsCollection.findUnique({
        where: { key },
        select: { revision: true, payload: true },
      });
      if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
      if (expectedRevision !== undefined && collection.revision !== expectedRevision) {
        throw new CmsRevisionConflictError(collection.revision);
      }
      return {
        data: cmsSchemas.siteContent.parse(collection.payload),
        pagination: pageInfo(1, 1, 1),
        revision: collection.revision,
      };
    }

    if (key === "news" || key === "communities" || key === "direction") {
      const [collection, allRecords] = await Promise.all([
        prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } }),
        prisma.cmsRecord.findMany({
          where: { collectionKey: key, locale: { in: ["en", "fr", "it"] } },
          orderBy: [{ locale: "asc" }, { position: "asc" }, { id: "asc" }],
          select: { locale: true, payload: true },
        }),
      ]);
      if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
      if (expectedRevision !== undefined && collection.revision !== expectedRevision) {
        throw new CmsRevisionConflictError(collection.revision);
      }

      if (allRecords.length > 0) {
        const enAll = allRecords.filter((r) => r.locale === "en").map((r) => r.payload);
        const frAll = allRecords.filter((r) => r.locale === "fr").map((r) => r.payload);
        const itAll = allRecords.filter((r) => r.locale === "it").map((r) => r.payload);
        const hasItalian = itAll.length > 0;
        const latest = await prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
        if (!latest) throw new Error(`CMS collection '${key}' has not been seeded`);
        if (latest.revision !== collection.revision) {
          if (expectedRevision !== undefined) throw new CmsRevisionConflictError(latest.revision);
          continue;
        }
        return {
          data: {
            en: enAll.slice((page - 1) * pageSize, page * pageSize),
            fr: frAll.slice((page - 1) * pageSize, page * pageSize),
            ...(hasItalian ? { it: itAll.slice((page - 1) * pageSize, page * pageSize) } : {}),
          },
          pagination: {
            en: pageInfo(page, pageSize, enAll.length),
            fr: pageInfo(page, pageSize, frAll.length),
            ...(hasItalian ? { it: pageInfo(page, pageSize, itAll.length) } : {}),
          },
          revision: collection.revision,
        };
      }

      // Fallback to legacy payload only if no cms_records exist
      const legacy = await prisma.cmsCollection.findUnique({ where: { key }, select: { payload: true } });
      const legacyLists = cmsSchemas[key].parse(legacy?.payload) as { en: unknown[]; fr: unknown[]; it?: unknown[] };
      const fallbackEn = legacyLists.en ?? [];
      const fallbackFr = legacyLists.fr ?? [];
      const fallbackIt = legacyLists.it;
      const latest = await prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
      if (!latest) throw new Error(`CMS collection '${key}' has not been seeded`);
      if (latest.revision !== collection.revision) {
        if (expectedRevision !== undefined) throw new CmsRevisionConflictError(latest.revision);
        continue;
      }
      return {
        data: {
          en: fallbackEn.slice((page - 1) * pageSize, page * pageSize),
          fr: fallbackFr.slice((page - 1) * pageSize, page * pageSize),
          ...(fallbackIt ? { it: fallbackIt.slice((page - 1) * pageSize, page * pageSize) } : {}),
        },
        pagination: {
          en: pageInfo(page, pageSize, fallbackEn.length),
          fr: pageInfo(page, pageSize, fallbackFr.length),
          ...(fallbackIt ? { it: pageInfo(page, pageSize, fallbackIt.length) } : {}),
        },
        revision: collection.revision,
      };
    }

    const [collection, allRecords] = await Promise.all([
      prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } }),
      prisma.cmsRecord.findMany({
        where: { collectionKey: key, locale: "all" },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { payload: true },
      }),
    ]);
    if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
    if (expectedRevision !== undefined && collection.revision !== expectedRevision) {
      throw new CmsRevisionConflictError(collection.revision);
    }

    if (allRecords.length > 0) {
      const data = allRecords.map((r) => r.payload);
      const latest = await prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
      if (!latest) throw new Error(`CMS collection '${key}' has not been seeded`);
      if (latest.revision !== collection.revision) {
        if (expectedRevision !== undefined) throw new CmsRevisionConflictError(latest.revision);
        continue;
      }
      return {
        data: data.slice((page - 1) * pageSize, page * pageSize),
        pagination: pageInfo(page, pageSize, data.length),
        revision: collection.revision,
      };
    }

    const legacy = await prisma.cmsCollection.findUnique({ where: { key }, select: { payload: true } });
    const legacyList = (cmsSchemas[key].parse(legacy?.payload) as unknown[]) ?? [];
    const latest = await prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
    if (!latest) throw new Error(`CMS collection '${key}' has not been seeded`);
    if (latest.revision !== collection.revision) {
      if (expectedRevision !== undefined) throw new CmsRevisionConflictError(latest.revision);
      continue;
    }
    return {
      data: legacyList.slice((page - 1) * pageSize, page * pageSize),
      pagination: pageInfo(page, pageSize, legacyList.length),
      revision: collection.revision,
    };
  }
  const current = await prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
  if (expectedRevision !== undefined && current && current.revision !== expectedRevision) {
    throw new CmsRevisionConflictError(current.revision);
  }
  throw new Error(`CMS collection '${key}' changed repeatedly while it was being read`);
}

export async function saveCmsCollection<K extends CmsCollectionKey>(
  key: K,
  payload: unknown,
  expectedRevision: number,
): Promise<{ revision: number; updatedAt: Date }> {
  const validated = cmsSchemas[key].parse(payload);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    throw new Error("A valid CMS revision is required to save content");
  }

  const saved = await prisma.$transaction(async (tx) => {
    const updated = await tx.cmsCollection.updateMany({
      where: { key, revision: expectedRevision },
      data: { payload: validated as never, revision: { increment: 1 } },
    });
    if (updated.count !== 1) {
      const current = await tx.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
      throw new CmsRevisionConflictError(current?.revision ?? 0);
    }

    await tx.cmsRecord.deleteMany({ where: { collectionKey: key } });
    const records = cmsRecordsFor(key, validated as CmsPayload<K>);
    for (let start = 0; start < records.length; start += 250) {
      await tx.cmsRecord.createMany({ data: records.slice(start, start + 250) as never });
    }

    return tx.cmsCollection.findUniqueOrThrow({
      where: { key },
      select: { revision: true, updatedAt: true },
    });
  }, {
    // Replacing the collection payload and its indexed records is one atomic
    // write. The default 5s interactive-transaction timeout is too short when
    // the local MySQL pool is busy, and Prisma then closes the transaction
    // while the callback is still issuing queries.
    maxWait: 10_000,
    timeout: 20_000,
  });
  invalidateCmsCollectionCache(key);
  return saved;
}

type GalleryItemData = { src: string; title: string; sub: string };

async function lockGalleryCollection(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<{ payload: unknown; revision: number }[]>`
    SELECT payload, revision FROM cms_collections WHERE \`key\` = ${"gallery"} FOR UPDATE
  `;
  const row = rows[0];
  if (!row) throw new Error("CMS collection 'gallery' has not been seeded");
  return { revision: row.revision, payload: cmsSchemas.gallery.parse(row.payload) as GalleryItemData[] };
}

export async function addGalleryItems(newItems: GalleryItemData[]) {
  const saved = await prisma.$transaction(async (tx) => {
    const collection = await lockGalleryCollection(tx);
    const existing = collection.payload;
    const updated = [...newItems, ...existing];
    const nextRevision = collection.revision + 1;
    await tx.cmsCollection.update({
      where: { key: "gallery" },
      data: { payload: updated as never, revision: { increment: 1 } },
    });
    await tx.cmsRecord.deleteMany({ where: { collectionKey: "gallery" } });
    const records = cmsRecordsFor("gallery", updated);
    for (let start = 0; start < records.length; start += 250) {
      await tx.cmsRecord.createMany({ data: records.slice(start, start + 250) as never });
    }
    return { revision: nextRevision, total: updated.length };
  }, { maxWait: 10_000, timeout: 20_000 });
  invalidateCmsCollectionCache("gallery");
  return saved;
}

export async function deleteGalleryItem({ index, src, expectedRevision }: { index?: number; src?: string; expectedRevision?: number }) {
  const saved = await prisma.$transaction(async (tx) => {
    const collection = await lockGalleryCollection(tx);
    if (expectedRevision !== undefined && collection.revision !== expectedRevision) {
      throw new CmsRevisionConflictError(collection.revision);
    }
    const existing = collection.payload;
    let updated: GalleryItemData[];
    if (typeof index === "number" && index >= 0 && index < existing.length) {
      updated = existing.filter((_, i) => i !== index);
    } else if (src) {
      updated = existing.filter((item) => item.src !== src);
    } else {
      throw new Error("Must provide index or src to delete photo");
    }
    const nextRevision = collection.revision + 1;
    await tx.cmsCollection.update({
      where: { key: "gallery" },
      data: { payload: updated as never, revision: { increment: 1 } },
    });
    await tx.cmsRecord.deleteMany({ where: { collectionKey: "gallery" } });
    const records = cmsRecordsFor("gallery", updated);
    for (let start = 0; start < records.length; start += 250) {
      await tx.cmsRecord.createMany({ data: records.slice(start, start + 250) as never });
    }
    return { revision: nextRevision, total: updated.length };
  }, { maxWait: 10_000, timeout: 20_000 });
  invalidateCmsCollectionCache("gallery");
  return saved;
}

export async function updateGalleryPageItems({
  page,
  pageSize,
  items,
  expectedRevision,
}: {
  page: number;
  pageSize: number;
  items: GalleryItemData[];
  expectedRevision?: number;
}) {
  const saved = await prisma.$transaction(async (tx) => {
    const collection = await lockGalleryCollection(tx);
    if (expectedRevision !== undefined && collection.revision !== expectedRevision) {
      throw new CmsRevisionConflictError(collection.revision);
    }
    const existing = collection.payload;
    const offset = (page - 1) * pageSize;
    const updated = [...existing];
    for (let i = 0; i < items.length; i++) {
      if (offset + i < updated.length) {
        updated[offset + i] = items[i];
      }
    }
    const nextRevision = collection.revision + 1;
    await tx.cmsCollection.update({
      where: { key: "gallery" },
      data: { payload: updated as never, revision: { increment: 1 } },
    });
    await tx.cmsRecord.deleteMany({ where: { collectionKey: "gallery" } });
    const records = cmsRecordsFor("gallery", updated);
    for (let start = 0; start < records.length; start += 250) {
      await tx.cmsRecord.createMany({ data: records.slice(start, start + 250) as never });
    }
    return { revision: nextRevision, total: updated.length };
  }, { maxWait: 10_000, timeout: 20_000 });
  invalidateCmsCollectionCache("gallery");
  return saved;
}
