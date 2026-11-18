import { readPublishedData } from "@/lib/getData";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import PaginatedVideos from "./PaginatedVideos";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr ? "Vidéos" : "Videos",
    description: isFr
      ? "Vidéos et films de la Province Sainte Famille SAC."
      : "Videos and films from the Holy Family Province SAC.",
  };
}

type Video = { src: string; poster: string; title: string };

export default async function VideosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const videos = await readPublishedData<Video[]>("videos", "videos.json");

  return (
    <>
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{lang === "fr" ? "Médias" : "Media"}</p>
          <h1>{lang === "fr" ? "Vidéos" : "Videos"}</h1>
          <p className="subtitle">{lang === "fr" ? "Province Sainte Famille · SAC" : "Holy Family Province · SAC"}</p>
        </div>
      </div>

      <main className="py-8 md:py-12 bg-[var(--cream)]">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">

          <div className="flex items-center gap-4 mb-6">
            <div className="w-1 h-8 bg-[var(--red)] " />
            <p className="text-[10px] font-black tracking-[0.35em] uppercase text-[var(--gold)]">
              {lang === "fr" ? `${videos.length} Vidéos` : `${videos.length} Videos`}
            </p>
            <div className="flex-1 h-px bg-[var(--cream3)]" />
          </div>

          <PaginatedVideos videos={videos} lang={lang} />

        </div>
      </main>

    </>
  );
}
