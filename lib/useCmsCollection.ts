"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cmsSchemas, type CmsCollectionKey } from "@/lib/cmsSchemas";

const collectionUrl = (key: CmsCollectionKey) => `/api/admin/${key}`;
export const cmsQueryKeys = {
  all: ["cms"] as const,
  collection: (key: CmsCollectionKey) => ["cms", "collection", key] as const,
  media: ["cms", "media"] as const,
  mediaPage: (page: number, pageSize: number, resourceType?: string) => ["cms", "media", page, pageSize, resourceType ?? "all"] as const,
};

type CmsCollectionSnapshot<T> = { payload: T; revision: number };

type PageInfo = { page: number; pageSize: number; total: number; totalPages: number; offset: number };
type PageEnvelope<T> = { data: T; pagination: PageInfo | { en: PageInfo; fr: PageInfo } };
// Editors currently publish a collection snapshot, so hydrate it through the
// paginated endpoint using its supported maximum page size.
const COLLECTION_PAGE_SIZE = 500;

async function responseError(response: Response): Promise<string> {
  const bodyText = await response.text().catch(() => "");
  if (!bodyText.trim()) return `Request failed (${response.status}). The server returned an empty response.`;
  try {
    const body = JSON.parse(bodyText) as { error?: string; issues?: { message: string }[] };
    return body.issues?.map((issue) => issue.message).join(" ") || body.error || `Request failed (${response.status}).`;
  } catch {
    return bodyText.slice(0, 300);
  }
}

async function responseJson<T>(response: Response): Promise<T> {
  const bodyText = await response.text();
  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(bodyText.trim() ? "The server returned an invalid response." : "The server returned an empty response.");
  }
}

async function fetchCollectionPage<T>(key: CmsCollectionKey, page: number, signal: AbortSignal, revision?: number) {
  const url = new URL(collectionUrl(key), window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(COLLECTION_PAGE_SIZE));
  const headers = revision === undefined ? undefined : { "If-Match": `"${revision}"` };
  const response = await fetch(url, { credentials: "include", cache: "no-store", signal, headers });
  if (!response.ok) throw new Error(await responseError(response));
  const currentRevision = Number(response.headers.get("X-CMS-Revision"));
  if (!Number.isSafeInteger(currentRevision) || currentRevision < 1) throw new Error("The CMS response is missing its revision.");
  if (revision !== undefined && currentRevision !== revision) throw new Error("CMS content changed while loading pages. Retry the request.");
  return { ...(await responseJson<PageEnvelope<T>>(response)), revision: currentRevision };
}

function getTotalPages(pagination: PageEnvelope<unknown>["pagination"]) {
  return "en" in pagination
    ? Math.max(pagination.en.totalPages, pagination.fr.totalPages)
    : pagination.totalPages;
}

async function fetchCollection<T>(key: CmsCollectionKey, signal: AbortSignal): Promise<CmsCollectionSnapshot<T>> {
  const firstPage = await fetchCollectionPage<T>(key, 1, signal);
  const pageCount = getTotalPages(firstPage.pagination);
  const remainingPages: PageEnvelope<T>[] = [];
  for (let page = 2; page <= pageCount; page += 1) {
    remainingPages.push(await fetchCollectionPage<T>(key, page, signal, firstPage.revision));
  }

  if (key === "siteContent") return { payload: firstPage.data as T, revision: firstPage.revision };
  const pages = [firstPage, ...remainingPages];
  if ("en" in firstPage.pagination) {
    const payload = {
      en: pages.flatMap((result) => (result.data as { en: unknown[]; fr: unknown[] }).en),
      fr: pages.flatMap((result) => (result.data as { en: unknown[]; fr: unknown[] }).fr),
    };
    return { payload: payload as T, revision: firstPage.revision };
  }
  return { payload: pages.flatMap((result) => result.data as unknown[]) as T, revision: firstPage.revision };
}

async function saveCollection<T>(key: CmsCollectionKey, payload: T, expectedRevision: number): Promise<number> {
  cmsSchemas[key].parse(payload);
  const response = await fetch(collectionUrl(key), {
    method: "PUT", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": `"${expectedRevision}"` }, body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await responseError(response));
  }
  const revision = Number(response.headers.get("X-CMS-Revision"));
  if (!Number.isSafeInteger(revision) || revision <= expectedRevision) throw new Error("The saved CMS revision is invalid.");
  return revision;
}

export function useCmsCollection<T>(key: CmsCollectionKey) {
  const query = useQuery({
    queryKey: cmsQueryKeys.collection(key),
    queryFn: ({ signal }) => fetchCollection<T>(key, signal),
    staleTime: 60_000,
  });
  return { ...query, data: query.data?.payload, revision: query.data?.revision };
}

export function useSaveCmsCollection<T>(key: CmsCollectionKey, getExpectedRevision: () => number | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: T) => {
      const expectedRevision = getExpectedRevision();
      if (expectedRevision === null) throw new Error("Wait for the latest content revision before saving.");
      await client.cancelQueries({ queryKey: cmsQueryKeys.collection(key) });
      const revision = await saveCollection(key, payload, expectedRevision);
      return { payload, revision };
    },
    onSuccess: ({ payload, revision }) => {
      client.setQueryData(cmsQueryKeys.collection(key), { payload, revision });
    },
  });
}
