import { slugify } from "@/lib/seoPaths";

const SEO_TITLE_LIMIT = 70;
const SEO_DESCRIPTION_LIMIT = 160;

function clipAtWord(value: string, limit: number) {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return (lastSpace > limit * 0.65 ? clipped.slice(0, lastSpace) : text.slice(0, limit)).trim();
}

export function createSeoMetadata(title: string, description: string) {
  const cleanTitle = title.trim().replace(/\s+/g, " ");
  const cleanDescription = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return {
    slug: slugify(cleanTitle),
    seoTitle: clipAtWord(cleanTitle, SEO_TITLE_LIMIT),
    seoDescription: clipAtWord(cleanDescription, SEO_DESCRIPTION_LIMIT),
  };
}
