import { z } from "zod";
import enDictionary from "../dictionaries/en.json";
import frDictionary from "../dictionaries/fr.json";
import { DEFAULT_SITE_THEME } from "./siteTheme";

const nonEmptyText = z.string().trim().min(1).max(5000);
const mediaUrl = z.string().trim().min(1).max(2048);

export const galleryItemSchema = z.object({
  src: mediaUrl,
  title: z.string().trim().max(300),
  sub: z.string().trim().max(500),
});

export const videoSchema = z.object({
  src: mediaUrl,
  poster: mediaUrl,
  title: nonEmptyText,
});

export const publicationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().max(120).optional(),
  number: z.string().max(32),
  title: nonEmptyText,
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  subtitle: z.string().max(500),
  description: z.string().max(5000),
  color: z.string().max(32),
  titleColor: z.string().max(32),
  subtitleColor: z.string().max(32),
  url: mediaUrl,
});

export const newsArticleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().max(120).optional(),
  title: nonEmptyText,
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  date: z.string().max(64),
  tags: z.string().max(500),
  summary: z.string().max(10000),
  content: z.string().max(50000).optional(),
  imageUrl: mediaUrl,
});

const bilingualNews = z.object({ en: z.array(newsArticleSchema).max(1000), fr: z.array(newsArticleSchema).max(1000) });
const communitySchema = z.object({
  id: nonEmptyText.max(191),
  name: nonEmptyText.max(500),
  location: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  image: mediaUrl.optional(),
  works: z.array(z.string().max(500)).max(100).optional(),
  memberSummary: z.string().max(10000).optional(),
  members: z.array(z.object({ name: nonEmptyText.max(500), role: z.string().max(1000) }).passthrough()).max(100).optional(),
}).passthrough();
const directionMemberSchema = z.object({
  name: nonEmptyText.max(500),
  role: nonEmptyText.max(1000),
  image: mediaUrl.optional(),
}).passthrough();
const bilingualCommunities = z.object({ en: z.array(communitySchema).max(1000), fr: z.array(communitySchema).max(1000) });
const bilingualDirection = z.object({ en: z.array(directionMemberSchema).max(100), fr: z.array(directionMemberSchema).max(100) });

function hasSameShape(value: unknown, baseline: unknown): boolean {
  if (typeof baseline === "string") return typeof value === "string" && value.length <= 20000;
  if (typeof baseline === "number") return typeof value === "number";
  if (typeof baseline === "boolean") return typeof value === "boolean";
  if (baseline === null) return value === null;
  if (Array.isArray(baseline)) {
    return Array.isArray(value) && (baseline.length === 0
      ? value.length === 0
      : value.every((entry) => baseline.some((sample) => hasSameShape(entry, sample))));
  }
  if (typeof baseline === "object" && baseline !== null) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const expectedKeys = Object.keys(baseline);
    const actualKeys = Object.keys(value);
    return expectedKeys.length === actualKeys.length && expectedKeys.every((key) =>
      Object.hasOwn(value, key) && hasSameShape((value as Record<string, unknown>)[key], (baseline as Record<string, unknown>)[key]),
    );
  }
  return false;
}

const dictionaryCopySchema = z.record(z.string(), z.unknown()).refine(
  (value) => hasSameShape(value, enDictionary),
  "Dictionary keys and value types must match the site content structure",
);
const siteThemeSchema = z.object(Object.fromEntries(
  Object.entries(DEFAULT_SITE_THEME).map(([key]) => [key, z.string().regex(/^#[0-9a-fA-F]{6}$/)]),
) as Record<keyof typeof DEFAULT_SITE_THEME, z.ZodString>);
const heroSlideSchema = z.object({
  image: mediaUrl,
  location: nonEmptyText.max(300),
  title: nonEmptyText.max(500),
  subtitle: z.string().max(1000),
});
const siteContentSchema = z.preprocess((input) => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return input;
  const content = input as Record<string, unknown>;
  const withRectorImageDefault = { ...content };
  for (const [locale, defaults] of [["en", enDictionary], ["fr", frDictionary]] as const) {
    const localized = content[locale];
    if (typeof localized !== "object" || localized === null || Array.isArray(localized)) continue;
    const localizedRecord = localized as Record<string, unknown>;
    const home = localizedRecord.home;
    if (typeof home !== "object" || home === null || Array.isArray(home)) continue;
    const homeRecord = home as Record<string, unknown>;
    withRectorImageDefault[locale] = {
      ...localizedRecord,
      home: {
        ...homeRecord,
        rectorImage: homeRecord.rectorImage ?? defaults.home.rectorImage,
      },
    };
  }
  return withRectorImageDefault;
}, z.object({
  en: dictionaryCopySchema,
  fr: z.record(z.string(), z.unknown()).refine((value) => hasSameShape(value, frDictionary), "French dictionary structure cannot be changed"),
  theme: siteThemeSchema,
}).superRefine((value, context) => {
  for (const locale of ["en", "fr"] as const) {
    const home = value[locale].home;
    const slides = typeof home === "object" && home !== null && !Array.isArray(home)
      ? (home as Record<string, unknown>).heroSlides
      : undefined;
    const result = z.array(heroSlideSchema).min(1).max(12).safeParse(slides);
    if (!result.success) context.addIssue({ code: "custom", path: [locale, "home", "heroSlides"], message: "Each language needs 1–12 complete hero slides" });
  }
}));

export const cmsSchemas = {
  gallery: z.array(galleryItemSchema).max(5000),
  videos: z.array(videoSchema).max(1000),
  publications: z.array(publicationSchema).max(1000),
  news: bilingualNews,
  communities: bilingualCommunities,
  direction: bilingualDirection,
  siteContent: siteContentSchema,
} as const;

export type CmsCollectionKey = keyof typeof cmsSchemas;
export type CmsPayload<K extends CmsCollectionKey> = z.infer<(typeof cmsSchemas)[K]>;

export function isCmsCollectionKey(value: string): value is CmsCollectionKey {
  return Object.hasOwn(cmsSchemas, value);
}
