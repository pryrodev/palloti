export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://palloti-website.vercel.app").replace(/\/$/, "");

export function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[œ]/g, "oe")
    .replace(/[æ]/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

export function getArticleSegment(article: { id: number | string; title: string; slug?: string }) {
  const slug = slugify(article.slug?.trim() || article.title) || "article";
  return `${slug}-${encodeURIComponent(String(article.id))}`;
}

export function getPublicationSegment(publication: { id: number | string; title: string; slug?: string }) {
  const slug = slugify(publication.slug?.trim() || publication.title) || "publication";
  return `${slug}-${encodeURIComponent(String(publication.id))}`;
}

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function parseDateForSeo(date: string) {
  const match = date.match(/^(\d{2})[/.\-](\d{2})[/.\-](\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}
