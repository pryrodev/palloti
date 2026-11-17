import { prisma } from "@/lib/prisma";
import { cmsSchemas, type CmsCollectionKey, type CmsPayload } from "@/lib/cmsSchemas";

export async function getCmsCollection<K extends CmsCollectionKey>(key: K): Promise<CmsPayload<K>> {
  const collection = await prisma.cmsCollection.findUnique({ where: { key } });
  if (!collection) throw new Error(`CMS collection '${key}' has not been seeded`);
  return cmsSchemas[key].parse(collection.payload) as CmsPayload<K>;
}

export async function saveCmsCollection<K extends CmsCollectionKey>(
  key: K,
  payload: unknown,
): Promise<{ revision: number; updatedAt: Date }> {
  const validated = cmsSchemas[key].parse(payload);
  const collection = await prisma.cmsCollection.upsert({
    where: { key },
    create: { key, payload: validated as never },
    update: { payload: validated as never, revision: { increment: 1 } },
    select: { revision: true, updatedAt: true },
  });
  return collection;
}
