import { z } from "zod";

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
  number: z.string().max(32),
  title: nonEmptyText,
  subtitle: z.string().max(500),
  description: z.string().max(5000),
  color: z.string().max(32),
  titleColor: z.string().max(32),
  subtitleColor: z.string().max(32),
  url: mediaUrl,
});

export const newsArticleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: nonEmptyText,
  date: z.string().max(64),
  tags: z.string().max(500),
  summary: z.string().max(10000),
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

export const cmsSchemas = {
  gallery: z.array(galleryItemSchema).max(5000),
  videos: z.array(videoSchema).max(1000),
  publications: z.array(publicationSchema).max(1000),
  news: bilingualNews,
  communities: bilingualCommunities,
  direction: bilingualDirection,
} as const;

export type CmsCollectionKey = keyof typeof cmsSchemas;
export type CmsPayload<K extends CmsCollectionKey> = z.infer<(typeof cmsSchemas)[K]>;

export function isCmsCollectionKey(value: string): value is CmsCollectionKey {
  return Object.hasOwn(cmsSchemas, value);
}
