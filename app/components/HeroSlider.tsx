"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Landmark, Users, Globe } from "lucide-react";

type Slide = {
  image: string;
  location: string;
  title: string;
  subtitle?: string;
  titleGold?: boolean;
  subtitleGold?: boolean;
};

const getSlides = (lang: string): Slide[] => [
  {
    image: "/images/gikondo.jpg",
    location: "Kigali — Gikondo, Rwanda",
    title: lang === "fr" ? "Maison Provinciale Sainte Famille" : "Holy Family Provincial House",
    subtitle: lang === "fr" ? "Siège de la Province Sainte Famille · Maison Mère" : "Seat of the Holy Family Province · Mother House",
    titleGold: true,
  },
  {
    image: "/images/hero.jpg",
    location: "Kigali — Rwanda",
    title: "Sanctuaire de la Miséricorde Divine",
  },
  {
    image: "/images/hero2.jpg",
    location: "Kibeho — Rwanda",
    title: lang === "fr" ? "La Nouvelle Communauté de Kibeho" : "The New Community of Kibeho",
    titleGold: true,
  },
  {
    image: "/images/home2.jpeg",
    location: lang === "fr" ? "Province Sainte Famille" : "Holy Family Province",
    title: lang === "fr" ? "Formation & Apostolat" : "Formation & Apostolate",
    subtitle: lang === "fr" ? "Vie communautaire et pastorale" : "Community & Pastoral Life",
  },
  {
    image: "/images/home3.jpg",
    location: lang === "fr" ? "Union de l'Apostolat Catholique" : "Union of Catholic Apostolate",
    title: lang === "fr" ? "Jeunesse & Vocations" : "Youth & Vocations",
    subtitle: lang === "fr" ? "Union de l'Apostolat Catholique" : "Union of Catholic Apostolate",
    subtitleGold: true,
  },
  {
    image: "/images/hero3.jpeg",
    location: "Montereau — France",
    title: "La Nouvelle Communauté Pallottine de Montereau",
  },
  {
    image: "/images/hero4.jpg",
    location: "PSF Province",
    title: "Pallottins de la PSF",
    subtitle: "Venez et rebâtissons les murailles de Jérusalem.",
    subtitleGold: true,
  },
  {
    image: "/images/hero5.jpg",
    location: "Kabuga — Rwanda",
    title: "Centre Pallottin de formation Genezareth",
    subtitle: "Keshero - R D Congo",
    subtitleGold: true,
  },
];

interface HeroSliderProps {
  lang: string;
  ctaPrimary: string;
  ctaSecondary: string;
  statFounded: string;
  statMembers: string;
  statCountries: string;
}

export default function HeroSlider({
  lang,
  ctaPrimary,
  ctaSecondary,
  statFounded,
  statMembers,
  statCountries,
}: HeroSliderProps) {
  const slides = getSlides(lang);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (animating) return;
      setAnimating(true);
      setCurrent(index);
      setTimeout(() => setAnimating(false), 800);
    },
    [animating]
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo, slides.length]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, reducedMotion]);

  return (
    <section
      className="relative overflow-hidden pt-2 pb-5 sm:pt-3 sm:pb-8 lg:pt-2 lg:pb-10"
      style={{ background: "linear-gradient(180deg, var(--cream3) 0 34%, var(--red-dk) 34% 100%)" }}
      aria-label={lang === "fr" ? "À la une" : "Featured stories"}
    >
      <div className="mx-auto grid max-w-[1480px] grid-cols-1 px-3 sm:px-6 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.8fr)] lg:px-10">
        {/* This brand panel stays fixed while the story and image change. */}
        <div className="relative z-10 flex min-h-[510px] flex-col items-center bg-[var(--cream)] px-5 py-7 text-center shadow-xl sm:px-8 sm:py-9 lg:min-h-[610px] lg:px-8 xl:px-10">
          <div className="flex h-[88px] w-[min(100%,240px)] shrink-0 items-center justify-center border border-[var(--cream3)] bg-white px-5 shadow-sm sm:h-[104px]">
            <Image src="/p4.png" alt="SAC Pallottins" width={240} height={48} className="h-auto w-full object-contain" priority />
          </div>

          <div className="mt-8 grid w-full content-start sm:mt-9">
            {slides.map((slide, i) => (
              <div
                key={`${slide.image}-${i}`}
                aria-hidden={i !== current}
                className="col-start-1 row-start-1 mx-auto w-full max-w-[360px] self-start transition-all duration-700 motion-reduce:transition-none"
                style={{
                  opacity: i === current ? 1 : 0,
                  transform: `translateY(${i === current ? "0px" : "12px"})`,
                  pointerEvents: i === current ? "auto" : "none",
                }}
              >
                <div className="mb-4 flex items-center justify-center gap-3 text-[var(--gold-dk)]">
                  <span className="h-px w-8 bg-[var(--gold)]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">{slide.location}</span>
                  <span className="h-px w-8 bg-[var(--gold)]" />
                </div>
                <h1
                  className="mx-auto max-w-md font-bold leading-[1.08] text-[var(--red-dk)]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(2rem, 3.25vw, 3.15rem)" }}
                >
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[var(--mid)] sm:text-base">
                    {slide.subtitle}
                  </p>
                )}
                <div className="mx-auto mt-6 h-px w-20 bg-[var(--gold)]/70" />
                <div className="mx-auto mt-6 flex w-full flex-wrap justify-center gap-3">
                  <Link
                    href={`/${lang}/identity`}
                    tabIndex={i === current ? 0 : -1}
                    className="inline-flex min-h-14 min-w-0 flex-[1_1_160px] items-center justify-center gap-2 bg-[var(--red)] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--red-dk)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                  >
                    <span className="text-center leading-4">{ctaPrimary}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href={`/${lang}/communities`}
                    tabIndex={i === current ? 0 : -1}
                    className="inline-flex min-h-14 min-w-0 flex-[1_1_140px] items-center justify-center border border-[var(--red)]/30 px-3 py-3 text-center text-[10px] font-bold uppercase leading-4 tracking-[0.1em] text-[var(--red)] transition-colors hover:border-[var(--red)] hover:bg-[var(--cream2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                  >
                    {ctaSecondary}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Only this image panel advances with the story content. */}
        <div className="relative min-h-[340px] overflow-hidden border-t-4 border-[var(--gold)] bg-[var(--red-dk)] sm:min-h-[440px] lg:min-h-[610px] lg:border-l-4 lg:border-t-0">
          {slides.map((slide, i) => (
            <div
              key={`image-${slide.image}`}
              className="absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none"
              style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
              aria-hidden={i !== current}
            >
              <div className="absolute inset-0" style={{ animation: i === current && !reducedMotion ? "hero-kenburns 8s ease-out forwards" : "none" }}>
                <Image src={slide.image} alt={slide.title} fill sizes="(min-width: 1024px) 65vw, 100vw" className="object-cover" priority={i === 0} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,15,5,0.42)] via-transparent to-[rgba(28,15,5,0.08)]" />
            </div>
          ))}

          <div className="absolute right-4 top-4 z-10 bg-[var(--red-dk)]/80 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[var(--gold-lt)] backdrop-blur-sm sm:right-6 sm:top-6">
            {String(current + 1).padStart(2, "0")} <span className="mx-1 text-white/50">/</span> {String(slides.length).padStart(2, "0")}
          </div>

          <button
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/60 bg-[var(--red-dk)]/35 text-white backdrop-blur-sm transition-colors hover:bg-[var(--red-dk)]/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-lt)] sm:left-5 sm:h-12 sm:w-12"
            aria-label={lang === "fr" ? "Diapositive précédente" : "Previous slide"}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/60 bg-[var(--red-dk)]/35 text-white backdrop-blur-sm transition-colors hover:bg-[var(--red-dk)]/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-lt)] sm:right-5 sm:h-12 sm:w-12"
            aria-label={lang === "fr" ? "Diapositive suivante" : "Next slide"}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>

          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 bg-[var(--red-dk)]/50 px-3 py-2 backdrop-blur-sm sm:bottom-7">
            {slides.map((slide, i) => (
              <button
                key={`dot-${slide.image}`}
                onClick={() => goTo(i)}
                className="h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-lt)] motion-reduce:transition-none"
                style={{ width: i === current ? "1.75rem" : "0.5rem", background: i === current ? "var(--gold-lt)" : "rgba(255,255,255,0.65)" }}
                aria-label={lang === "fr" ? `Aller à la diapositive ${i + 1}` : `Go to slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-[1400px] border-t border-[var(--gold)]/70 bg-[var(--red-dk)] sm:mt-7 lg:mt-8">
        <div className="grid grid-cols-3 divide-x divide-white/15">
          {[
            { num: "1890", label: statFounded, Icon: Landmark, color: "#E8B84B" },
            { num: "111+", label: statMembers, Icon: Users, color: "#E8B84B" },
            { num: "3", label: statCountries, Icon: Globe, color: "#E8B84B" },
          ].map(({ num, label, Icon, color }) => (
            <div key={label} className="flex items-center justify-center gap-2 px-2 py-4 sm:gap-4 sm:py-5">
              <Icon className="hidden h-5 w-5 shrink-0 text-[var(--gold)] sm:block" strokeWidth={1.7} aria-hidden="true" />
              <div>
                <span className="block text-center font-bold leading-none sm:text-left" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", color }}>{num}</span>
                <span className="mt-1 block text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-white/80 sm:text-left sm:text-[10px]">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes hero-kenburns { from { transform: scale(1.06); } to { transform: scale(1); } }`}</style>
    </section>
  );
}
