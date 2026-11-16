"use client";

import Image from "next/image";
import Link from "next/link";

interface MovingShowcaseProps {
  lang: string;
}

export default function MovingShowcase({ lang }: MovingShowcaseProps) {
  const isFr = lang === "fr";

  const items = [
    {
      type: "logo",
      title: "Province Sainte Famille",
      subtitle: "SAC · Pallottines",
      image: "/p4.png",
      tag: isFr ? "Logo Officiel" : "Official Logo",
      href: `/${lang}/identity`,
    },
    {
      type: "house",
      title: isFr ? "Maison Provinciale de Gikondo" : "Gikondo Provincial House",
      subtitle: isFr ? "Siège de la Province Sainte Famille" : "Seat of the Holy Family Province",
      image: "/images/gikondo.jpg",
      tag: isFr ? "Inzu ya Province" : "Provincial House",
      href: `/${lang}/communities`,
      featured: true,
    },
    {
      type: "photo",
      title: isFr ? "Sanctuaire de la Miséricorde Divine" : "Divine Mercy Sanctuary",
      subtitle: "Kigali — Rwanda",
      image: "/images/hero.jpg",
      tag: "Sanctuaire",
      href: `/${lang}/communities`,
    },
    {
      type: "photo",
      title: isFr ? "Communauté de Kibeho" : "Kibeho Community",
      subtitle: "Kibeho — Rwanda",
      image: "/images/hero2.jpg",
      tag: "Communauté",
      href: `/${lang}/communities`,
    },
    {
      type: "logo",
      title: "Societas Apostolatus Catholici",
      subtitle: "Caritas Christi Urget Nos",
      image: "/p4.png",
      tag: "SAC",
      href: `/${lang}/identity`,
    },
    {
      type: "photo",
      title: isFr ? "Formation & Apostolat" : "Formation & Apostolate",
      subtitle: isFr ? "Vie communautaire et pastorale" : "Community & Pastoral Life",
      image: "/images/home2.jpeg",
      tag: "Apostolat",
      href: `/${lang}/galleries`,
    },
    {
      type: "photo",
      title: isFr ? "Centre Genezareth Keshero" : "Genezareth Centre Keshero",
      subtitle: "Goma — RD Congo",
      image: "/images/hero5.jpg",
      tag: "RDC",
      href: `/${lang}/communities`,
    },
    {
      type: "photo",
      title: isFr ? "Jeunesse & Vocations" : "Youth & Vocations",
      subtitle: isFr ? "Union de l'Apostolat Catholique" : "Union of Catholic Apostolate",
      image: "/images/home3.jpg",
      tag: "UAC",
      href: `/${lang}/galleries`,
    },
  ];

  // Duplicate items for continuous seamless loop
  const loopItems = [...items, ...items];

  return (
    <section className="relative py-12 md:py-16 overflow-hidden bg-[var(--cream2)] border-y border-[var(--gold)]/30">
      {/* Background watermark cross / pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
        <Image src="/p4.png" alt="" width={600} height={600} className="object-contain" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 mb-8 text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/70 border border-[var(--gold)]/40 shadow-sm mb-3">
          <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--red)]">
            {isFr ? "Province Sainte Famille · En Mouvement" : "Holy Family Province · In Motion"}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--red-dk)]" style={{ fontFamily: "Georgia, serif" }}>
          {isFr ? "Inzu ya Province, Logo n'Ibikorwa bya Pallottins" : "Provincial House, Logo & Pallottine Communities"}
        </h3>
        <div className="w-16 h-[2px] bg-[var(--gold)] mx-auto mt-3" />
      </div>

      {/* Infinite scrolling marquee track */}
      <div className="relative w-full overflow-hidden">
        {/* Soft edge blur overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[var(--cream2)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[var(--cream2)] to-transparent z-10 pointer-events-none" />

        <div className="marquee-track flex gap-5 w-max">
          {loopItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`group flex-shrink-0 relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                item.featured
                  ? "w-80 md:w-96 ring-2 ring-[var(--gold)] shadow-lg"
                  : item.type === "logo"
                  ? "w-64 md:w-72 bg-gradient-to-br from-[#3e2009] to-[#5c3317] border border-[var(--gold)]/50"
                  : "w-72 md:w-80 border border-[var(--cream3)] bg-white"
              }`}
              style={{ height: 260 }}
            >
              {item.type === "logo" ? (
                /* Logo card */
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white relative">
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[var(--gold)] text-[var(--dark)]">
                    {item.tag}
                  </div>
                  <div className="relative w-24 h-24 mb-4 transition-transform duration-500 group-hover:scale-110">
                    <Image src={item.image} alt={item.title} fill className="object-contain" />
                  </div>
                  <h4 className="font-bold text-base text-[var(--gold-lt)] leading-tight mb-1" style={{ fontFamily: "Georgia, serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-white/80 italic">{item.subtitle}</p>
                </div>
              ) : (
                /* Photo card (Inzu ya Province / Community / Work) */
                <div className="h-full relative overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  {/* Gradient shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,15,5,0.92)] via-[rgba(28,15,5,0.35)] to-transparent" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                        item.featured
                          ? "bg-[var(--gold)] text-[var(--dark)] shadow-md"
                          : "bg-white/90 text-[var(--red)] backdrop-blur-sm"
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>

                  {/* Content on bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                    <div className="w-8 h-[2px] bg-[var(--gold)] mb-2 group-hover:w-14 transition-all duration-300" />
                    <h4
                      className="font-bold text-base sm:text-lg leading-snug group-hover:text-[var(--gold-lt)] transition-colors"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-white/80 mt-1 line-clamp-1">{item.subtitle}</p>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Marquee Animation Styles */}
      <style jsx>{`
        .marquee-track {
          display: flex;
          animation: continuousScroll 38s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes continuousScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
