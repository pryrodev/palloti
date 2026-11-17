import fs from "fs";
import path from "path";
import { getCmsCollection } from "@/lib/cmsRepository";

type Dictionary = typeof import("../dictionaries/en.json");

export async function getDictionary(lang: string) {
  const file = lang === "fr" ? "fr.json" : "en.json";
  const filePath = path.join(process.cwd(), "dictionaries", file);
  const content = fs.readFileSync(filePath, "utf-8");
  const dictionary = JSON.parse(content) as Dictionary;
  try {
    const locale = lang === "fr" ? "fr" : "en";
    const [news, communities, direction] = await Promise.all([
      getCmsCollection("news"), getCmsCollection("communities"), getCmsCollection("direction"),
    ]);
    const articles = news[locale];
    dictionary.newsSection.articles = articles as Dictionary["newsSection"]["articles"];
    dictionary.home.newsItems = articles.slice(0, 6).map((article) => ({
      date: article.date, tags: article.tags, title: article.title, excerpt: article.summary, image: article.imageUrl,
    })) as Dictionary["home"]["newsItems"];
    dictionary.communities.items = communities[locale] as Dictionary["communities"]["items"];
    dictionary.direction.members = direction[locale] as Dictionary["direction"]["members"];
  } catch {
    // Keep committed dictionaries available when local MySQL is stopped or before first seed.
  }
  return dictionary;
}
