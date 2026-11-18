import fs from "fs";
import path from "path";
import { getCmsCollection } from "@/lib/cmsRepository";
import type { CmsCollectionKey } from "@/lib/cmsSchemas";

function readData<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

async function readPublishedData<T>(key: CmsCollectionKey, fallbackFile: string): Promise<T> {
  if (!process.env.DATABASE_URL) return readData<T>(fallbackFile);
  try { return await getCmsCollection(key) as T; }
  catch { return readData<T>(fallbackFile); }
}

export { readData, readPublishedData };
