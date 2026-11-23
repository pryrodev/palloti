import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated(req);
  if (!authed) return unauthorized();

  try {
    const [newsEnCount, newsFrCount, pubCount, galCount, vidCount, recentNewsRows] = await Promise.all([
      prisma.cmsRecord.count({ where: { collectionKey: "news", locale: "en" } }),
      prisma.cmsRecord.count({ where: { collectionKey: "news", locale: "fr" } }),
      prisma.cmsRecord.count({ where: { collectionKey: "publications", locale: "all" } }),
      prisma.cmsRecord.count({ where: { collectionKey: "gallery", locale: "all" } }),
      prisma.cmsRecord.count({ where: { collectionKey: "videos", locale: "all" } }),
      prisma.cmsRecord.findMany({
        where: { collectionKey: "news", locale: "en" },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        take: 12,
        select: { payload: true },
      }),
    ]);

    // If records are present in cmsRecord, return counts directly
    if (newsEnCount > 0 || pubCount > 0 || galCount > 0 || vidCount > 0) {
      return NextResponse.json({
        stats: {
          news: { en: newsEnCount, fr: newsFrCount },
          publications: pubCount,
          gallery: galCount,
          videos: vidCount,
        },
        recentNews: recentNewsRows.map((r) => r.payload),
      }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // Fallback if records haven't been seeded into cms_records table yet
    const collections = await prisma.cmsCollection.findMany({
      where: { key: { in: ["news", "publications", "gallery", "videos"] } },
      select: { key: true, payload: true },
    });

    const colMap = new Map(collections.map((c) => [c.key, c.payload]));
    const newsData = colMap.get("news") as { en?: unknown[]; fr?: unknown[] } | undefined;
    const pubData = colMap.get("publications") as unknown[] | undefined;
    const galData = colMap.get("gallery") as unknown[] | undefined;
    const vidData = colMap.get("videos") as unknown[] | undefined;

    const enArticles = (newsData?.en ?? []) as Array<Record<string, unknown>>;
    const frArticles = (newsData?.fr ?? []) as Array<Record<string, unknown>>;

    return NextResponse.json({
      stats: {
        news: { en: enArticles.length, fr: frArticles.length },
        publications: pubData?.length ?? 0,
        gallery: galData?.length ?? 0,
        videos: vidData?.length ?? 0,
      },
      recentNews: enArticles.slice(0, 12),
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Dashboard overview query failed", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
