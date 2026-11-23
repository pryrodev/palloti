import type { MetadataRoute } from "next";
import { getDictionary } from "@/lib/getDictionary";
import { readPublishedData } from "@/lib/getData";
import { absoluteUrl, getArticleSegment, getPublicationSegment } from "@/lib/seoPaths";
import type { Publication } from "./[lang]/publications/publicationsQuery";

const PUBLIC_ROUTES = ["", "identity", "direction", "communities", "news", "galleries", "videos", "publications", "catalog", "contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languages = ["en", "fr", "it"];
  const [dictionaries, publications] = await Promise.all([
    Promise.all(languages.map((lang) => getDictionary(lang))),
    readPublishedData<Publication[]>("publications", "publications.json"),
  ]);

  const staticPages = languages.flatMap((lang) => PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route ? `/${lang}/${route}` : `/${lang}`),
    changeFrequency: route === "news" ? "weekly" as const : "monthly" as const,
    priority: route === "" ? 1 : route === "news" ? 0.8 : 0.6,
  })));
  const newsPages = dictionaries.flatMap((dictionary, index) =>
    dictionary.newsSection.articles.map((article) => ({
      url: absoluteUrl(`/${languages[index]}/news/${getArticleSegment(article)}`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  );
  const publicationPages = languages.flatMap((lang) => publications.map((publication) => ({
    url: absoluteUrl(`/${lang}/publications/${getPublicationSegment(publication)}`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  })));

  return [...staticPages, ...newsPages, ...publicationPages];
}
