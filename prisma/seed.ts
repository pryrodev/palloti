import { readdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { cmsSchemas, type CmsCollectionKey } from "../lib/cmsSchemas";

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

async function seed() {
  const [gallery, videos, publications, en, fr] = await Promise.all([
    jsonFile<unknown>("data/gallery.json"),
    jsonFile<unknown>("data/videos.json"),
    jsonFile<unknown>("data/publications.json"),
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
  };

  for (const [key, payload] of Object.entries(collections) as [CmsCollectionKey, unknown][]) {
    const validatedPayload = cmsSchemas[key].parse(payload);
    await prisma.cmsCollection.upsert({
      where: { key },
      create: { key, payload: validatedPayload as never },
      update: {},
    });
  }

  const mediaFiles = (await Promise.all(["images", "videos", "pdfs"].map((folder) => legacyMediaFiles(folder as "images" | "videos" | "pdfs")))).flat();
  for (const asset of mediaFiles) {
    await prisma.mediaAsset.upsert({ where: { publicId: asset.publicId }, create: asset, update: {} });
  }
  console.log(`Seeded ${Object.keys(collections).length} CMS collections and ${mediaFiles.length} legacy media assets (existing database content was preserved).`);
}

seed().finally(() => prisma.$disconnect());
