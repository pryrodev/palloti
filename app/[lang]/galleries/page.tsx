import { Header } from "../../components/header";
import { Footer } from "../../components/Footer";
import { getDictionary } from "@/lib/getDictionary";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import { LayoutGrid, Card } from "../../components/ui/LayoutGrid";
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

const allImages = [
  { src: "/images/picture1.jpeg",  title: "Communauté de Bruxelles",        sub: "Belgium" },
  { src: "/images/p2.jpg",         title: "Provincial Assembly",             sub: "Kigali, Rwanda" },
  { src: "/images/p5.jpg",         title: "Appointments 2026-2027",          sub: "Holy Family Province" },
  { src: "/images/p6.jpg",         title: "International Meeting",           sub: "Kigali, Rwanda" },
  { src: "/images/p7.jpg",         title: "Info PSF No 25",                  sub: "March 2026" },
  { src: "/images/p8.jpg",         title: "Handover Ceremony",               sub: "Holy Family Province" },
  { src: "/images/pic1.jpeg",      title: "Provincial Council",              sub: "Holy Family Province" },
  { src: "/images/home2.jpeg",     title: "Formation & Apostolate",          sub: "Holy Family Province" },
  { src: "/images/picture2.jpg",   title: "XII Consultative Congress",       sub: "SAC Major Superiors" },
  { src: "/images/home3.jpg",      title: "Youth & Vocations",               sub: "Union of Catholic Apostolate" },
  { src: "/images/home4.jpeg",     title: "SAC Congress",                    sub: "2020" },
  { src: "/images/home5.jpeg",     title: "SAC Congress",                    sub: "Community Life" },
  { src: "/images/home6.jpeg",     title: "SAC Congress",                    sub: "Apostolic Work" },
  { src: "/images/image1.jpeg",    title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image2.jpeg",    title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image3.jpeg",    title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image4.jpeg",    title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image5.jpeg",    title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image6.jpeg",    title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image16.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image17.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image18.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image19.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image20.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image21.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image22.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image23.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image24.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image25.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image26.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image27.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image28.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image29.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image30.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image31.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image32.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image33.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image34.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image35.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },

  { src: "/images/image37.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image38.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image40.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image41.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image42.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image43.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image44.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image45.jpeg",   title: "Holy Family Province",            sub: "Life & Ministry" },
  { src: "/images/image47.jpeg",   title: "SAC Province",                    sub: "Recent Moments" },
];

// Assign layout classes in a repeating pattern for a bento-style grid
const classNames = [
  "md:col-span-2",
  "col-span-1",
  "col-span-1",
  "col-span-1",
  "md:col-span-2",
  "col-span-1",
  "col-span-1",
  "col-span-1",
  "md:col-span-2",
  "col-span-1",
  "col-span-1",
  "col-span-1",
];

const cards: Card[] = allImages.map((img, i) => ({
  id: i + 1,
  thumbnail: img.src,
  className: classNames[i % classNames.length],
  content: (
    <div>
      <p className="font-bold text-white text-base md:text-xl font-sans">{img.title}</p>
      <p className="font-normal text-base text-white/80 font-sans mt-1">{img.sub}</p>
    </div>
  ),
}));

export default async function GalleriesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang);

  return (
    <>
      <Header lang={lang} navigation={dict.navigation} />
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
            <div className="w-1 h-8 bg-[var(--red)] rounded" />
            <div>
              <p className="text-[10px] font-black tracking-[0.35em] uppercase text-[var(--gold)]">
                {lang === "fr" ? "Albums Photos" : "Photo Albums"}
              </p>
              <p className="text-[var(--gold)] text-sm mt-0.5">
                {allImages.length} {lang === "fr" ? "photos" : "photos"}
              </p>
            </div>
            <div className="flex-1 h-px bg-[#e8e2d9]" />
          </div>
        </div>

        {/* ── LayoutGrid — full-width bento ── */}
        <LayoutGrid cards={cards} />

      </main>

      <Footer lang={lang} dict={dict.footer} navigation={dict.navigation} />
    </>
  );
}
