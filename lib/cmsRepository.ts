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
  return prisma.$transaction(async (tx) => {
    const collection = await tx.cmsCollection.findUnique({
      where: { key },
      select: { revision: true },
    });
    if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
    if (expectedRevision !== undefined && collection.revision !== expectedRevision) {
      throw new CmsRevisionConflictError(collection.revision);
    }

    if (key === "siteContent") {
      const siteContentCollection = await tx.cmsCollection.findUnique({ where: { key }, select: { payload: true } });
      if (!siteContentCollection) throw new Error(`CMS collection '${key}' has not been seeded`);
      return {
        data: cmsSchemas.siteContent.parse(siteContentCollection.payload),
        pagination: pageInfo(1, 1, 1),
        revision: collection.revision,
      };
    }

    const recordWhere = { collectionKey: key };
    if (await tx.cmsRecord.count({ where: recordWhere }) === 0) {
      const legacyCollection = await tx.cmsCollection.findUnique({ where: { key }, select: { payload: true } });
      if (!legacyCollection) throw new Error(`CMS collection '${key}' has not been seeded`);
      const legacyRecords = cmsRecordsFor(key, cmsSchemas[key].parse(legacyCollection.payload) as never);
      for (let start = 0; start < legacyRecords.length; start += 250) {
        await tx.cmsRecord.createMany({ data: legacyRecords.slice(start, start + 250) as never, skipDuplicates: true });
      }
    }

    if (key === "news" || key === "communities" || key === "direction") {
      const [enRows, frRows, enTotal, frTotal] = await Promise.all([
        tx.cmsRecord.findMany({ where: { collectionKey: key, locale: "en" }, orderBy: [{ position: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize, select: { payload: true } }),
        tx.cmsRecord.findMany({ where: { collectionKey: key, locale: "fr" }, orderBy: [{ position: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize, select: { payload: true } }),
        tx.cmsRecord.count({ where: { collectionKey: key, locale: "en" } }),
        tx.cmsRecord.count({ where: { collectionKey: key, locale: "fr" } }),
      ]);
      return {
        data: {
          en: enRows.map((row) => row.payload),
          fr: frRows.map((row) => row.payload),
        },
        pagination: { en: pageInfo(page, pageSize, enTotal), fr: pageInfo(page, pageSize, frTotal) },
        revision: collection.revision,
      };
    }

    const where = { collectionKey: key, locale: "all" };
    const [rows, total] = await Promise.all([
      tx.cmsRecord.findMany({ where, orderBy: [{ position: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize, select: { payload: true } }),
      tx.cmsRecord.count({ where }),
    ]);
    return { data: rows.map((row) => row.payload), pagination: pageInfo(page, pageSize, total), revision: collection.revision };
  });
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
  });
}
