import Image from "next/image";
import Link from "next/link";
import { Newsletter } from "../components/Newsletter";
import { getDictionary } from "@/lib/getDictionary";
import { FadeUp, StaggerContainer, StaggerItem } from "../components/motion";
import HeroSlider from "../components/HeroSlider";
import DecorativeDivider from "../components/ui/DecorativeDivider";
import { getArticleSegment } from "@/lib/seoPaths";
import ArticleBody from "./news/[id]/ArticleBody";

type NewsItem = { id: number | string; slug?: string; date: string; tags: string; title: string; excerpt: string; image?: string };

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const news: NewsItem[] = (dict.newsSection.articles as (typeof dict.newsSection.articles[number] & { slug?: string })[]).slice(0, 6).map((article) => ({
    id: article.id,
    slug: article.slug,
    date: article.date,
    tags: article.tags,
    title: article.title,
    excerpt: article.summary,
    image: article.imageUrl,
  }));

  return (
    <>

      {/* ═══════════════════════════════════════
          § 1  HERO SLIDER
      ═══════════════════════════════════════ */}
      <DecorativeDivider />
      <HeroSlider
        lang={lang}
        slides={dict.home.heroSlides}
        ctaPrimary={dict.home.ctaPrimary}
        ctaSecondary={dict.home.ctaSecondary}
        statFounded={dict.home.statFounded}
        statMembers={dict.home.statMembers}
        statCountries={dict.home.statCountries}
      />

      {/* ═══════════════════════════════════════
          § 2  RECTOR'S WELCOME — MAGAZINE
      ═══════════════════════════════════════ */}
      <section className="py-8 md:py-12 lg:py-14" style={{ background: "var(--cream)" }}>
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">

          {/* ── Top rule + label ── */}
          <FadeUp className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1" style={{ background: "var(--gold)" }} />
            <span className="badge">{dict.home.welcomeBadge}</span>
            <div className="h-px flex-1" style={{ background: "var(--gold)" }} />
          </FadeUp>

          {/* ── Magazine spread: LEFT photo | RIGHT text ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* LEFT — balanced, clean portrait card (no dark or colored background) */}
            <FadeUp className="lg:col-span-5 flex flex-col items-center lg:items-start w-full">
              <div className="w-full max-w-sm sm:max-w-md  overflow-hidden border-2 border-[var(--gold)]/50 shadow-xl bg-white">
                <div className="relative w-full aspect-[4/5] max-h-[480px] bg-white">
                  <Image
                    src={dict.home.rectorImage}
                    alt={dict.home.rectorName}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 450px"
                    className="object-cover object-top"
                  />
                </div>
                {/* Clean name plate below photo — no dark gradient overlay */}
                <div className="p-5 sm:p-6 bg-white border-t border-[var(--cream3)] text-left">
                  <div className="w-8 h-[2px] mb-2 bg-[var(--gold)]" />
                  <p className="font-bold text-lg sm:text-xl leading-tight text-[var(--red)]" style={{ fontFamily: "Georgia, serif" }}>
                    {dict.home.rectorName}
                  </p>
                  <p className="text-[11px] font-bold tracking-[0.2em] uppercase mt-1 text-[var(--gold)]">
                    {dict.home.rectorTitle}
                  </p>
                </div>
              </div>
              <div className="mt-6 w-full max-w-sm border-t-2 border-[var(--gold)] px-1 pt-5 sm:max-w-md">
                <p className="font-serif text-base italic leading-relaxed text-[var(--red)] sm:text-lg">
                  &ldquo;{dict.home.rectorQuote}&rdquo;
                </p>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-dk)]">
                  &mdash; {dict.home.rectorName}
                </p>
              </div>
            </FadeUp>

            {/* RIGHT — article text */}
            <FadeUp delay={0.15} className="lg:col-span-7 flex flex-col pt-4 lg:pt-0">

              {/* Article headline */}
              <div>
                <h2 className="mb-6 leading-tight" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "var(--dark)" }}>
                  {dict.home.welcomeTitle}
                </h2>
                <div className="w-14 h-[3px] mb-8" style={{ background: "var(--gold)" }} />

                {/* Body copy */}
                <div className="space-y-5">
                  {typeof dict.home.welcomeBody === "string" ? (
                    <ArticleBody content={dict.home.welcomeBody} fallback="" />
                  ) : Array.isArray(dict.home.welcomeBody) ? (
                    (dict.home.welcomeBody as string[]).map((p: string, i: number) => (
                      <p key={i} className="text-base leading-[1.9]" style={{ color: "var(--mid)", textAlign: "justify" }}>{p}</p>
                    ))
                  ) : null}
                </div>
              </div>

            </FadeUp>
          </div>

        </div>
      </section>



      {/* ═══════════════════════════════════════
          § 4  NEWS
      ═══════════════════════════════════════ */}
      <section className="py-8 md:py-12 lg:py-14 bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">

          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="badge">{dict.home.newsBadge}</span>
                <h2 className="section-title mt-2">{dict.home.newsTitle}</h2>
                <div className="divider mt-4" />
              </div>
              <Link href={`/${lang}/news`}
                className="group flex items-center gap-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--red)] hover:text-[var(--gold)] transition-colors shrink-0">
                {dict.home.viewAllNews}
                <span className="w-8 h-px bg-[var(--gold)] group-hover:w-12 transition-all duration-300" />
              </Link>
            </div>
          </FadeUp>

          <div className="grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-8 lg:gap-10">

            {/* ── FEATURED CARD — photo on top, text below ── */}
            <FadeUp>
              <Link href={`/${lang}/news/${news[0] ? getArticleSegment(news[0]) : ""}`} className="group flex flex-col bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]"
                style={{ border: "1px solid var(--cream3)", boxShadow: "0 4px 24px rgba(58,31,10,0.08)" }}>
                {/* Photo */}
                <div className="relative overflow-hidden" style={{ height: "300px" }}>
                  <Image src={news[0]?.image ?? "/images/p5.jpg"} alt={news[0]?.title} fill sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {/* Date badge over photo */}
                  <div className="absolute top-4 left-4 px-3 py-1.5" style={{ background: "var(--gold)" }}>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "var(--dark)" }}>
                      {news[0]?.date}
                    </span>
                  </div>
                </div>
                {/* Text below photo */}
                <div className="p-6 sm:p-8 flex flex-col flex-1">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: "var(--gold)" }}>
                    {news[0]?.tags}
                  </p>
                  <h3 className="font-bold leading-snug mb-4 flex-1 group-hover:text-[var(--red)] transition-colors"
                    style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.1rem, 2vw, 1.45rem)", color: "var(--dark)" }}>
                    {news[0]?.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-6 line-clamp-3" style={{ color: "var(--gray)" }}>
                    {news[0]?.excerpt}
                  </p>
                  <div className="flex items-center gap-3 pt-5" style={{ borderTop: "1px solid var(--cream3)" }}>
                    <span className="read-more">{dict.home.readStory}</span>
                    <span className="w-6 h-px bg-[var(--gold)] group-hover:w-10 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            </FadeUp>

            {/* ── SIDE LIST — thumbnail left, text right ── */}
            <StaggerContainer className="flex flex-col gap-0 divide-y divide-[var(--cream3)]">
              {news.slice(1, 5).map((item, i) => (
                <StaggerItem key={i}>
                  <Link href={`/${lang}/news/${getArticleSegment(item)}`} className="group flex gap-4 py-5 first:pt-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                    {/* Thumbnail */}
                    <div className="relative shrink-0 overflow-hidden " style={{ width: 80, height: 80 }}>
                      <Image src={item.image ?? "/images/p5.jpg"} alt={item.title} fill sizes="80px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    {/* Text */}
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-1  shrink-0" style={{ background: "var(--gold)" }} />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--gold)" }}>
                          {item.date}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-[var(--red)] transition-colors"
                        style={{ fontFamily: "Georgia, serif", color: "var(--dark)" }}>
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="read-more" style={{ fontSize: "0.65rem" }}>{dict.home.readStory}</span>
                        <span className="w-3 h-px bg-[var(--gold)] group-hover:w-6 transition-all duration-300" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      
      <section className="relative py-8 md:py-10 overflow-hidden bg-gradient-to-br from-[var(--red-dk)] via-[var(--red)] to-[var(--red-lt)]">

       
        <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none hidden xl:block">
          <svg width="240" height="240" viewBox="0 0 100 100" fill="white">
            <rect x="43" y="5" width="14" height="90" />
            <rect x="5" y="38" width="90" height="14" />
          </svg>
        </div>

        <FadeUp className="relative z-10 container mx-auto px-6 text-center max-w-2xl">

        
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-px bg-[var(--gold)]/50" />
            <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-[var(--gold)]">
              {dict.home.missionBadge}
            </span>
            <div className="w-10 h-px bg-[var(--gold)]/50" />
          </div>

    
          <blockquote className="text-white font-light italic leading-snug mb-6 text-2xl md:text-3xl">
            &ldquo;{dict.home.missionQuote}&rdquo;
          </blockquote>

          {/* Author */}
          <p className="text-white text-xs font-bold tracking-[0.3em] uppercase mb-6">
            — {dict.home.missionAuthor}
          </p>

      
          <Link
            href={`/${lang}/identity`}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/40 text-white text-xs font-bold uppercase tracking-[0.15em]  hover:bg-white hover:text-[var(--red-dk)] transition-all duration-300"
          >
            {dict.home.ctaPrimary}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

        </FadeUp>
      </section>

      <Newsletter
        title={dict.newsletter.title}
        description={dict.newsletter.description}
        placeholder={dict.newsletter.placeholder}
        buttonText={dict.newsletter.button}
        successMessage={dict.newsletter.success}
      />
    </>
  );
}
