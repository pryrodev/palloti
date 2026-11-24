import fs from "fs";
import path from "path";
import { cache } from "react";
import enDictionary from "@/dictionaries/en.json";
import frDictionary from "@/dictionaries/fr.json";
import itDictionary from "@/dictionaries/it.json";
import { getCmsCollection } from "@/lib/cmsRepository";
import { DEFAULT_SITE_THEME, type SiteTheme } from "@/lib/siteTheme";

type Dictionary = typeof import("../dictionaries/en.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function applyChangedEnglishCmsCopy(
  englishCms: unknown,
  englishDefaults: unknown,
  localizedCms: unknown,
  localizedDefaults: unknown,
): unknown {
  if (Array.isArray(englishDefaults)) {
    const englishChanged = JSON.stringify(englishCms) !== JSON.stringify(englishDefaults);
    const localizedChanged = JSON.stringify(localizedCms) !== JSON.stringify(localizedDefaults);
    return englishChanged && !localizedChanged ? englishCms : localizedCms;
  }
  if (isRecord(englishDefaults)) {
    const currentEnglish = isRecord(englishCms) ? englishCms : {};
    const localized = isRecord(localizedCms) ? localizedCms : {};
    const localizedBaseline = isRecord(localizedDefaults) ? localizedDefaults : {};
    const merged: Record<string, unknown> = { ...localized };
    for (const [key, value] of Object.entries(currentEnglish)) {
      merged[key] = Object.hasOwn(englishDefaults, key)
        ? applyChangedEnglishCmsCopy(value, englishDefaults[key], localized[key], localizedBaseline[key])
        : value;
    }
    return merged;
  }
  const englishChanged = JSON.stringify(englishCms) !== JSON.stringify(englishDefaults);
  const localizedChanged = JSON.stringify(localizedCms) !== JSON.stringify(localizedDefaults);
  return englishChanged && !localizedChanged ? englishCms : localizedCms;
}

function mergeLocalizedRecords<T extends Record<string, unknown>>(
  localized: T[] | undefined,
  english: T[],
  keyOf: (item: T) => string,
): T[] {
  const translatedByKey = new Map((localized ?? []).map((item) => [keyOf(item), item]));
  const seen = new Set<string>();
  const merged = english.map((item) => {
    const key = keyOf(item);
    seen.add(key);
    return { ...item, ...translatedByKey.get(key) };
  });
  for (const item of localized ?? []) {
    if (!seen.has(keyOf(item))) merged.push(item);
  }
  return merged;
}

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
  const siteContent = await getCmsCollection("siteContent").catch((error) => {
    console.error("CMS collection read failed (siteContent); using dictionary defaults.", error);
    return null;
  });
  const news = await getCmsCollection("news").catch((error) => {
    console.error("CMS collection read failed (news); using dictionary defaults.", error);
    return null;
  });
  const communities = await getCmsCollection("communities").catch((error) => {
    console.error("CMS collection read failed (communities); using dictionary defaults.", error);
    return null;
  });
  const direction = await getCmsCollection("direction").catch((error) => {
    console.error("CMS collection read failed (direction); using dictionary defaults.", error);
    return null;
  });
  if (siteContent) {
    const localized = siteContent[locale];
    if (locale === "en") {
      if (localized) Object.assign(dictionary, localized);
    } else {
      const localizedDefaults = locale === "fr" ? frDictionary : itDictionary;
      const translatedFallback = applyChangedEnglishCmsCopy(
        siteContent.en,
        enDictionary,
        localized ?? dictionary,
        localizedDefaults,
      );
      if (isRecord(translatedFallback)) Object.assign(dictionary, translatedFallback);
    }
    if (siteContent.theme) dictionary.theme = siteContent.theme;
  }
  if (news) {
    const articles = locale === "en"
      ? news.en
      : mergeLocalizedRecords(news[locale], news.en, (article) => String(article.id));
    if (articles) {
      dictionary.newsSection.articles = articles as Dictionary["newsSection"]["articles"];
      dictionary.home.newsItems = articles.slice(0, 6).map((article) => ({
        date: article.date, tags: article.tags, title: article.title, excerpt: article.summary, image: article.imageUrl,
      })) as Dictionary["home"]["newsItems"];
    }
  }
  if (communities) {
    const comms = locale === "en"
      ? communities.en
      : mergeLocalizedRecords(communities[locale], communities.en, (community) => String(community.id));
    if (comms) dictionary.communities.items = comms as Dictionary["communities"]["items"];
  }
  if (direction) {
    const dir = locale === "en"
      ? direction.en
      : mergeLocalizedRecords(direction[locale], direction.en, (member) =>
          String(member.image ?? member.name).normalize("NFKC").trim().toLocaleLowerCase(),
        );
    if (dir) dictionary.direction.members = dir as Dictionary["direction"]["members"];
  }
  return dictionary;
});
