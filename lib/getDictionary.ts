import fs from "fs";
import path from "path";
import { cache } from "react";
import { getCmsCollection } from "@/lib/cmsRepository";
import { DEFAULT_SITE_THEME, type SiteTheme } from "@/lib/siteTheme";

type Dictionary = typeof import("../dictionaries/en.json");

export const getDictionary = cache(async function getDictionary(lang: string) {
  const file = lang === "fr" ? "fr.json" : lang === "it" ? "it.json" : "en.json";
  const filePath = path.join(process.cwd(), "dictionaries", file);
  const content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf-8")
    : fs.readFileSync(path.join(process.cwd(), "dictionaries", "en.json"), "utf-8");
  const dictionary = JSON.parse(content) as Dictionary & { theme: SiteTheme };
  dictionary.theme = { ...DEFAULT_SITE_THEME };
  if (!process.env.DATABASE_URL) return dictionary;
  const locale = lang === "fr" ? "fr" : lang === "it" ? "it" : "en";
  // Keep one database read in flight per server render to avoid exhausting the
  // MySQL pool when several public pages render at the same time.
  const siteContent = await getCmsCollection("siteContent").catch(() => null);
  const news = await getCmsCollection("news").catch(() => null);
  const communities = await getCmsCollection("communities").catch(() => null);
  const direction = await getCmsCollection("direction").catch(() => null);
  if (siteContent) {
    const localized = siteContent[locale] ?? siteContent.en;
    if (localized) Object.assign(dictionary, localized);
    if (siteContent.theme) dictionary.theme = siteContent.theme;
  }
  if (news) {
    const articles = news[locale] ?? news.en;
    if (articles) {
      dictionary.newsSection.articles = articles as Dictionary["newsSection"]["articles"];
      dictionary.home.newsItems = articles.slice(0, 6).map((article) => ({
        date: article.date, tags: article.tags, title: article.title, excerpt: article.summary, image: article.imageUrl,
      })) as Dictionary["home"]["newsItems"];
    }
  }
  if (communities) {
    const comms = communities[locale] ?? communities.en;
    if (comms) dictionary.communities.items = comms as Dictionary["communities"]["items"];
  }
  if (direction) {
    const dir = direction[locale] ?? direction.en;
    if (dir) dictionary.direction.members = dir as Dictionary["direction"]["members"];
  }
  return dictionary;
});
