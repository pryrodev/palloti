import type { CmsCollectionKey, CmsPayload } from "./cmsSchemas";

export type CmsRecordInput = {
  collectionKey: CmsCollectionKey;
  locale: "all" | "en" | "fr";
  itemKey: string;
  position: number;
  payload: unknown;
};

const BILINGUAL_LISTS = new Set<CmsCollectionKey>(["news", "communities", "direction"]);

export function cmsRecordsFor<K extends CmsCollectionKey>(key: K, payload: CmsPayload<K>): CmsRecordInput[] {
  if (key === "siteContent") return [];

  const records: CmsRecordInput[] = [];
  if (BILINGUAL_LISTS.has(key)) {
    const localized = payload as Record<"en" | "fr", unknown[]>;
    for (const locale of ["en", "fr"] as const) {
      localized[locale].forEach((item, position) => records.push({
        collectionKey: key,
        locale,
        itemKey: String(position),
        position,
        payload: item,
      }));
    }
    return records;
  }

  (payload as unknown[]).forEach((item, position) => records.push({
    collectionKey: key,
    locale: "all",
    itemKey: String(position),
    position,
    payload: item,
  }));
  return records;
}
