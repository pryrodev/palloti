import fs from "fs";
import path from "path";
import { cache } from "react";
import { getCmsCollection } from "@/lib/cmsRepository";
import { DEFAULT_SITE_THEME, type SiteTheme } from "@/lib/siteTheme";

type Dictionary = typeof import("../dictionaries/en.json");

export const getDictionary = cache(async function getDictionary(lang: string) {
  const file = lang === "fr" ? "fr.json" : "en.json";
  const filePath = path.join(process.cwd(), "dictionaries", file);
  const content = fs.readFileSync(filePath, "utf-8");
  const dictionary = JSON.parse(content) as Dictionary & { theme: SiteTheme };
  dictionary.theme = { ...DEFAULT_SITE_THEME };
  if (!process.env.DATABASE_URL) return dictionary;
  const locale = lang === "fr" ? "fr" : "en";
  // Keep one database read in flight per server render to avoid exhausting the
  // MySQL pool when several public pages render at the same time.
  const siteContent = await getCmsCollection("siteContent").catch(() => null);
  const news = await getCmsCollection("news").catch(() => null);
  const communities = await getCmsCollection("communities").catch(() => null);
  const direction = await getCmsCollection("direction").catch(() => null);
  if (siteContent) {
    Object.assign(dictionary, siteContent[locale]);
    dictionary.theme = siteContent.theme;
  }
  if (news) {
    const articles = news[locale];
    dictionary.newsSection.articles = articles as Dictionary["newsSection"]["articles"];
    dictionary.home.newsItems = articles.slice(0, 6).map((article) => ({
      date: article.date, tags: article.tags, title: article.title, excerpt: article.summary, image: article.imageUrl,
    })) as Dictionary["home"]["newsItems"];
  }
  if (communities) dictionary.communities.items = communities[locale] as Dictionary["communities"]["items"];
  if (direction) dictionary.direction.members = direction[locale] as Dictionary["direction"]["members"];
  return dictionary;
});
