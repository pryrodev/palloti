import { Header } from "../../components/header";
import { Footer } from "../../components/Footer";
import { getDictionary } from "@/lib/getDictionary";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import VideoPlayer from "../../components/VideoPlayer";
import { LayoutGrid, Card } from "../../components/ui/LayoutGrid";

const allImages = [
  { src: "/images/picture1.jpeg",   alt: "Community 1",     title: "Communauté de Bruxelles",         sub: "Belgium" },
  { src: "/images/p2.jpg",          alt: "Community 2",     title: "Provincial Assembly",              sub: "Kigali, Rwanda" },
  { src: "/images/p5.jpg",          alt: "Community 3",     title: "Appointments 2026-2027",           sub: "Holy Family Province" },
  { src: "/images/p6.jpg",          alt: "Community 4",     title: "International Meeting",            sub: "Kigali, Rwanda" },
  { src: "/images/p7.jpg",          alt: "Community 5",     title: "Info PSF No 25",                   sub: "March 2026" },
  { src: "/images/p8.jpg",          alt: "Community 6",     title: "Handover Ceremony",                sub: "Holy Family Province" },
  { src: "/images/pic1.jpeg",       alt: "Community 7",     title: "Provincial Council",               sub: "Holy Family Province" },
  { src: "/images/home2.jpeg",      alt: "Community 8",     title: "Formation & Apostolate",           sub: "Holy Family Province" },
  { src: "/images/picture2.jpg",    alt: "Congress 1",      title: "XII Consultative Congress",        sub: "SAC Major Superiors" },
  { src: "/images/home3.jpg",       alt: "Congress 2",      title: "Youth & Vocations",                sub: "Union of Catholic Apostolate" },
  { src: "/images/home4.jpeg",      alt: "Congress 3",      title: "SAC Congress",                     sub: "2020" },
  { src: "/images/home5.jpeg",      alt: "Congress 4",      title: "SAC Congress",                     sub: "Community Life" },
  { src: "/images/home6.jpeg",      alt: "Congress 5",      title: "SAC Congress",                     sub: "Apostolic Work" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.22%20AM.jpeg",     alt: "Life 1",  title: "Holy Family Province",  sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.22%20AM%20(1).jpeg", alt: "Life 2", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.22%20AM%20(2).jpeg", alt: "Life 3", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.23%20AM.jpeg",     alt: "Life 4",  title: "Holy Family Province",  sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.23%20AM%20(1).jpeg", alt: "Life 5", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.23%20AM%20(2).jpeg", alt: "Life 6", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.24%20AM.jpeg",     alt: "Life 7",  title: "Holy Family Province",  sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.24%20AM%20(1).jpeg", alt: "Life 8", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.24%20AM%20(2).jpeg", alt: "Life 9", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.25%20AM.jpeg",     alt: "Life 10", title: "Holy Family Province",  sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.25%20AM%20(1).jpeg", alt: "Life 11", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.26%20AM.jpeg",     alt: "Life 12", title: "Holy Family Province",  sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.26%20AM%20(1).jpeg", alt: "Life 13", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.26%20AM%20(2).jpeg", alt: "Life 14", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.26%20AM%20(3).jpeg", alt: "Life 15", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.27%20AM.jpeg",     alt: "Life 16", title: "Holy Family Province",  sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.27%20AM%20(1).jpeg", alt: "Life 17", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.27%20AM%20(2).jpeg", alt: "Life 18", title: "Holy Family Province", sub: "Life & Ministry" },
  { src: "/images/WhatsApp%20Image%202026-11-16%20at%209.44.28%20AM.jpeg",     alt: "Life 19", title: "SAC Province",           sub: "Recent Moments" },
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
      <p className="font-bold text-white text-base md:text-xl font-sans">
        {img.title}
      </p>
      <p className="font-normal text-base text-white/80 font-sans mt-1">
        {img.sub}
      </p>
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

        {/* ── Videos section ── */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20 mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1 h-8 bg-[var(--red)] rounded" />
            <div>
              <p className="text-[10px] font-black tracking-[0.35em] uppercase text-[var(--gold)]">
                {lang === "fr" ? "Vidéos & Films" : "Videos & Movies"}
              </p>
            </div>
            <div className="flex-1 h-px bg-[#e8e2d9]" />
          </div>

          <VideoPlayer src="/videos/video1.mp4" poster="/images/gikondo.jpg" />
        </div>

      </main>

      <Footer lang={lang} dict={dict.footer} navigation={dict.navigation} />
    </>
  );
}
