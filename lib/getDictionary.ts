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
  const [siteContent, news, communities, direction] = await Promise.allSettled([
    getCmsCollection("siteContent"), getCmsCollection("news"), getCmsCollection("communities"), getCmsCollection("direction"),
  ]);
  if (siteContent.status === "fulfilled") {
    Object.assign(dictionary, siteContent.value[locale]);
    dictionary.theme = siteContent.value.theme;
  }
  if (news.status === "fulfilled") {
    const articles = news.value[locale];
    dictionary.newsSection.articles = articles as Dictionary["newsSection"]["articles"];
    dictionary.home.newsItems = articles.slice(0, 6).map((article) => ({
      date: article.date, tags: article.tags, title: article.title, excerpt: article.summary, image: article.imageUrl,
    })) as Dictionary["home"]["newsItems"];
  }
  if (communities.status === "fulfilled") dictionary.communities.items = communities.value[locale] as Dictionary["communities"]["items"];
  if (direction.status === "fulfilled") dictionary.direction.members = direction.value[locale] as Dictionary["direction"]["members"];
  return dictionary;
});
