import { readdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { cmsSchemas, type CmsCollectionKey } from "../lib/cmsSchemas";
import { cmsRecordsFor } from "../lib/cmsRecords";
import { DEFAULT_SITE_THEME } from "../lib/siteTheme";

const prisma = new PrismaClient();
const root = process.cwd();

async function jsonFile<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8")) as T;
}

async function legacyMediaFiles(folder: "images" | "videos" | "pdfs") {
  let names: string[];
  try { names = await readdir(path.join(root, "public", folder)); }
  catch { return []; }
  const resourceType = folder === "images" ? "image" : folder === "videos" ? "video" : "raw";
  return Promise.all(names.filter((name) => !name.startsWith(".")).map(async (name) => {
    const relativeUrl = folder === "pdfs" ? `/api/pdf/${encodeURIComponent(name)}` : `/${folder}/${encodeURIComponent(name)}`;
    const publicId = `local/${createHash("sha256").update(relativeUrl).digest("hex")}`;
    const details = await stat(path.join(root, "public", folder, name));
    return {
      publicId,
      url: relativeUrl,
      secureUrl: relativeUrl,
      provider: "local",
      resourceType,
      format: path.extname(name).slice(1).toLowerCase() || null,
      bytes: details.size,
    };
  }));
}

function mergeMissingDefaults(defaults: unknown, current: unknown): unknown {
  if (Array.isArray(defaults)) return Array.isArray(current) ? current : defaults;
  if (typeof defaults === "object" && defaults !== null) {
    const currentRecord = typeof current === "object" && current !== null && !Array.isArray(current)
      ? current as Record<string, unknown>
      : {};
    return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [
      key,
      Object.hasOwn(currentRecord, key) ? mergeMissingDefaults(value, currentRecord[key]) : value,
    ]));
  }
  return current === undefined ? defaults : current;
}

async function seed() {
  const [gallery, videos, publications, catalog, en, fr] = await Promise.all([
    jsonFile<unknown>("data/gallery.json"),
    jsonFile<unknown>("data/videos.json"),
    jsonFile<unknown>("data/publications.json"),
    jsonFile<unknown>("data/catalog.json"),
    jsonFile<{ newsSection: { articles: unknown[] }; communities: { items: unknown[] }; direction: { members: unknown[] } }>("dictionaries/en.json"),
    jsonFile<{ newsSection: { articles: unknown[] }; communities: { items: unknown[] }; direction: { members: unknown[] } }>("dictionaries/fr.json"),
  ]);

  const collections: Record<CmsCollectionKey, unknown> = {
    gallery,
    videos,
    publications,
    news: { en: en.newsSection.articles, fr: fr.newsSection.articles },
    communities: { en: en.communities.items, fr: fr.communities.items },
    direction: { en: en.direction.members, fr: fr.direction.members },
    catalog,
    siteContent: { en, fr, theme: DEFAULT_SITE_THEME },
  };

  for (const [key, payload] of Object.entries(collections) as [CmsCollectionKey, unknown][]) {
    const validatedPayload = cmsSchemas[key].parse(payload);
    if (key === "siteContent") {
      const existing = await prisma.cmsCollection.findUnique({ where: { key } });
      if (existing) {
        const merged = mergeMissingDefaults(validatedPayload, existing.payload);
        await prisma.cmsCollection.update({ where: { key }, data: { payload: cmsSchemas[key].parse(merged) as never, revision: { increment: 1 } } });
        continue;
      }
    }
    await prisma.cmsCollection.upsert({
      where: { key },
      create: { key, payload: validatedPayload as never },
      update: {},
    });
    const stored = await prisma.cmsCollection.findUniqueOrThrow({ where: { key }, select: { payload: true } });
    const records = cmsRecordsFor(key, cmsSchemas[key].parse(stored.payload) as never);
    await prisma.cmsRecord.deleteMany({ where: { collectionKey: key } });
    for (let start = 0; start < records.length; start += 250) {
      await prisma.cmsRecord.createMany({ data: records.slice(start, start + 250) as never });
    }
  }

  const mediaFiles = (await Promise.all(["images", "videos", "pdfs"].map((folder) => legacyMediaFiles(folder as "images" | "videos" | "pdfs")))).flat();
  for (const asset of mediaFiles) {
    await prisma.mediaAsset.upsert({ where: { publicId: asset.publicId }, create: asset, update: {} });
  }
  console.log(`Seeded ${Object.keys(collections).length} CMS collections and ${mediaFiles.length} legacy media assets (existing database content was preserved).`);
}

seed().finally(() => prisma.$disconnect());
