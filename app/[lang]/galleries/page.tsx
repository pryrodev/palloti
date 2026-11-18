import { getDictionary } from "@/lib/getDictionary";
import { readPublishedData } from "@/lib/getData";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import PaginatedGallery from "./PaginatedGallery";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr ? "Galerie Photos" : "Photo Gallery",
    description: isFr
      ? "Galerie de photos de la vie et des activités de la Province Sainte Famille SAC."
      : "Photo gallery of the life and activities of the Holy Family Province SAC.",
  };
}

export default async function GalleriesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [dict, allImages] = await Promise.all([
    getDictionary(lang),
    readPublishedData<{ src: string; title: string; sub: string }[]>("gallery", "gallery.json"),
  ]);
  return (
    <>
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{dict.galleries.badge}</p>
          <h1>{dict.galleries.title}</h1>
          <p className="subtitle">{dict.galleries.subtitle}</p>
        </div>
      </div>

      <main className="py-8 md:py-12 bg-[var(--cream)]">

        {/* ── Photos section header ── */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-1 h-8 bg-[var(--red)] " />
            <div>
              <p className="text-[10px] font-black tracking-[0.35em] uppercase text-[var(--gold)]">
                {lang === "fr" ? "Albums Photos" : "Photo Albums"}
              </p>
              <p className="text-[var(--gold)] text-sm mt-0.5">
                {allImages.length} {lang === "fr" ? "photos" : "photos"}
              </p>
            </div>
            <div className="flex-1 h-px bg-[var(--cream3)]" />
          </div>
        </div>

        {/* ── LayoutGrid — full-width bento ── */}
        <PaginatedGallery images={allImages} lang={lang} />

      </main>

    </>
  );
}
