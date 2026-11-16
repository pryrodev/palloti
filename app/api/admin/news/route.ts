import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { readDictionary, writeDictionary } from "@/lib/getData";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const en = readDictionary("en");
  const fr = readDictionary("fr");
  return NextResponse.json({ en: en.newsSection.articles, fr: fr.newsSection.articles });
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const { en: enArticles, fr: frArticles } = await req.json();
  const en = readDictionary("en");
  const fr = readDictionary("fr");
  en.newsSection.articles = enArticles;
  en.home.newsItems = enArticles.slice(0, 6).map((a: { title: string; date: string; tags: string; summary: string; imageUrl: string }) => ({
    date: a.date, tags: a.tags, title: a.title, excerpt: a.summary, image: a.imageUrl,
  }));
  fr.newsSection.articles = frArticles;
  fr.home.newsItems = frArticles.slice(0, 6).map((a: { title: string; date: string; tags: string; summary: string; imageUrl: string }) => ({
    date: a.date, tags: a.tags, title: a.title, excerpt: a.summary, image: a.imageUrl,
  }));
  writeDictionary("en", en);
  writeDictionary("fr", fr);
  return NextResponse.json({ ok: true });
}
