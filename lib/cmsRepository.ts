import { prisma } from "@/lib/prisma";
import { cmsSchemas, type CmsCollectionKey, type CmsPayload } from "@/lib/cmsSchemas";
import { cmsRecordsFor } from "@/lib/cmsRecords";

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
  const snapshot = await getCmsCollectionSnapshot(key);
  return snapshot.payload;
}

export type CmsPageInfo = { page: number; pageSize: number; total: number; totalPages: number; offset: number };
export type CmsCollectionPage = {
  data: unknown;
  pagination: CmsPageInfo | { en: CmsPageInfo; fr: CmsPageInfo };
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
  // Reads must not hold an interactive transaction open while doing paginated
  // queries. Prisma serializes queries on a transaction connection, and its
  // default interactive transaction timeout is five seconds. The revision
  // check below gives us a consistent view without that long-lived transaction.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const collection = await prisma.cmsCollection.findUnique({
      where: { key },
      select: { revision: true, payload: true },
    });
    if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
    if (expectedRevision !== undefined && collection.revision !== expectedRevision) {
      throw new CmsRevisionConflictError(collection.revision);
    }

    if (key === "siteContent") {
      return {
        data: cmsSchemas.siteContent.parse(collection.payload),
        pagination: pageInfo(1, 1, 1),
        revision: collection.revision,
      };
    }

    const legacyPayload = cmsSchemas[key].parse(collection.payload) as never;

    if (key === "news" || key === "communities" || key === "direction") {
      const legacyLists = legacyPayload as { en: unknown[]; fr: unknown[] };
      const localized = {} as Record<"en" | "fr", { data: unknown[]; pagination: CmsPageInfo }>;
      for (const locale of ["en", "fr"] as const) {
        const where = { collectionKey: key, locale };
        const total = await prisma.cmsRecord.count({ where });
        const rows = total === 0 ? [] : await prisma.cmsRecord.findMany({ where, orderBy: [{ position: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize, select: { payload: true } });
        const fallback = legacyLists[locale];
        localized[locale] = {
          data: total === 0 ? fallback.slice((page - 1) * pageSize, page * pageSize) : rows.map((row) => row.payload),
          pagination: pageInfo(page, pageSize, total === 0 ? fallback.length : total),
        };
      }
      const current = await prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
      if (current?.revision !== collection.revision) continue;
      return {
        data: { en: localized.en.data, fr: localized.fr.data },
        pagination: { en: localized.en.pagination, fr: localized.fr.pagination },
        revision: collection.revision,
      };
    }

    const where = { collectionKey: key, locale: "all" };
    const total = await prisma.cmsRecord.count({ where });
    const rows = total === 0 ? [] : await prisma.cmsRecord.findMany({ where, orderBy: [{ position: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize, select: { payload: true } });
    const legacyList = legacyPayload as unknown[];
    const current = await prisma.cmsCollection.findUnique({ where: { key }, select: { revision: true } });
    if (current?.revision !== collection.revision) continue;
    return {
      data: total === 0 ? legacyList.slice((page - 1) * pageSize, page * pageSize) : rows.map((row) => row.payload),
      pagination: pageInfo(page, pageSize, total === 0 ? legacyList.length : total),
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

  return prisma.$transaction(async (tx) => {
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
}
