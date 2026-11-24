import { cmsSchemas, type CmsCollectionKey } from "@/lib/cmsSchemas";

const collectionUrl = (key: CmsCollectionKey) => `/api/admin/${key}`;
const COLLECTION_PAGE_SIZE = 500;

type PageInfo = { page: number; pageSize: number; total: number; totalPages: number; offset: number };
type LocalizedPageInfo = { en: PageInfo; fr: PageInfo; it?: PageInfo };
type LocalizedPageData = { en: unknown[]; fr: unknown[]; it?: unknown[] };
type PageEnvelope<T> = { data: T; pagination: PageInfo | LocalizedPageInfo };
export type CmsCollectionSnapshot<T> = { payload: T; revision: number };

async function responseError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text.trim()) return `Request failed (${response.status}). The server returned an empty response.`;
  try {
    const body = JSON.parse(text) as { error?: string; issues?: { message: string }[] };
    return body.issues?.map(({ message }) => message).join(" ") || body.error || `Request failed (${response.status}).`;
  } catch { return text.slice(0, 300); }
}

async function responseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; }
  catch { throw new Error(text.trim() ? "The server returned an invalid response." : "The server returned an empty response."); }
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

export async function fetchCmsCollection<T>(key: CmsCollectionKey, signal: AbortSignal): Promise<CmsCollectionSnapshot<T>> {
  const first = await fetchCollectionPage<T>(key, 1, signal);
  const count = "en" in first.pagination
    ? Math.max(...Object.values(first.pagination).map((locale) => locale.totalPages))
    : first.pagination.totalPages;
  const pages = [first];
  for (let page = 2; page <= count; page += 1) pages.push(await fetchCollectionPage<T>(key, page, signal, first.revision));
  if (key === "siteContent") return { payload: first.data as T, revision: first.revision };
  if ("en" in first.pagination) {
    const locales = (["en", "fr", "it"] as const).filter((locale) => Array.isArray((first.data as LocalizedPageData)[locale]));
    const payload = Object.fromEntries(locales.map((locale) => [
      locale,
      pages.flatMap((page) => (page.data as LocalizedPageData)[locale] ?? []),
    ]));
    return { payload: payload as T, revision: first.revision };
  }
  return { payload: pages.flatMap((p) => p.data as unknown[]) as T, revision: first.revision };
}

export async function saveCmsCollection<T>(key: CmsCollectionKey, payload: T, expectedRevision: number): Promise<number> {
  cmsSchemas[key].parse(payload);
  const response = await fetch(collectionUrl(key), { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": `"${expectedRevision}"` }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(await responseError(response));
  const revision = Number(response.headers.get("X-CMS-Revision"));
  if (!Number.isSafeInteger(revision) || revision <= expectedRevision) throw new Error("The saved CMS revision is invalid.");
  return revision;
}
