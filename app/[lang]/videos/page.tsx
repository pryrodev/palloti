import { Header } from "../../components/header";
import { Footer } from "../../components/Footer";
import { getDictionary } from "@/lib/getDictionary";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import VideoPlayer from "../../components/VideoPlayer";
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

const videos = [
  { src: "/videos/video1.mp4", poster: "/images/gikondo.jpg",  title: "Video 1 — Holy Family Province" },
  { src: "/videos/video2.mp4", poster: "/images/image31.jpeg", title: "Video 2 — Holy Family Province" },
  { src: "/videos/video3.mp4", poster: "/images/image16.jpeg", title: "Video 3 — Holy Family Province" },
];

export default async function VideosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang);

  return (
    <>
      <Header lang={lang} navigation={dict.navigation} />
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
            <div className="w-1 h-8 bg-[var(--red)] rounded" />
            <p className="text-[10px] font-black tracking-[0.35em] uppercase text-[var(--gold)]">
              {lang === "fr" ? `${videos.length} Vidéos` : `${videos.length} Videos`}
            </p>
            <div className="flex-1 h-px bg-[#e8e2d9]" />
          </div>

          <div className="flex flex-col gap-8">
            {videos.map((v) => (
              <VideoPlayer key={v.src} src={v.src} poster={v.poster} title={v.title} />
            ))}
          </div>

        </div>
      </main>

      <Footer lang={lang} dict={dict.footer} navigation={dict.navigation} />
    </>
  );
}
