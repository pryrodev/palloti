"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Church,
  Cross,
  Globe2,
  ListFilter,
  Megaphone,
  Newspaper,
  Shapes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getArticleSegment } from "@/lib/seoPaths";

type Article = {
  id: number | string;
  slug?: string;
  title: string;
  date: string;
  tags: string;
  summary: string;
  content?: string;
  imageUrl: string;
};

type CategoryKey = "all" | "province" | "newspaper" | "generalate" | "union" | "announce" | "reflections" | "others";
type Category = { key: CategoryKey; label: string; match: string; icon: LucideIcon };

const PAGE_SIZE = 6;

interface NewsFilterProps {
  articles: Article[];
  readMore: string;
  lang: string;
  allPublicationsLabel: string;
}

const CATEGORY_COPY = {
  en: {
    eyebrow: "Filter by category",
    all: "All",
    province: "Holy Family Province",
    newspaper: "Pallottines’ Newspaper",
    generalate: "Generalate",
    union: "Union of the Catholic Apostolate",
    announce: "Announcements",
    reflections: "Reflections & Life",
    others: "Others",
    results: "Showing results for",
    noResults: "No articles in this category.",
    showAll: "View all articles",
    showing: "Showing",
    page: "Page",
    previous: "Previous",
    next: "Next",
  },
  fr: {
    eyebrow: "Filtrer par catégorie",
    all: "Toutes",
    province: "Province Sainte Famille",
    newspaper: "Journal Pallottin",
    generalate: "Généralat",
    union: "Union de l’Apostolat Catholique",
    announce: "Communiqués",
    reflections: "Réflexions et vie",
    others: "Autres",
    results: "Résultats pour",
    noResults: "Aucun article dans cette catégorie.",
    showAll: "Voir tous les articles",
    showing: "Affichage",
    page: "Page",
    previous: "Précédent",
    next: "Suivant",
  },
} as const;

export default function NewsFilter({ articles, readMore, lang, allPublicationsLabel }: NewsFilterProps) {
  const isFrench = lang === "fr";
  const copy = isFrench ? CATEGORY_COPY.fr : CATEGORY_COPY.en;
  const categories: Category[] = [
    { key: "all", label: copy.all, match: "", icon: ListFilter },
    { key: "province", label: copy.province, match: isFrench ? "Province Sainte Famille" : "Holy Family Province", icon: Church },
    { key: "newspaper", label: copy.newspaper, match: isFrench ? "Journal Pallottin" : "Pallottines' Newspaper", icon: Newspaper },
    { key: "generalate", label: copy.generalate, match: isFrench ? "Généralat" : "Generalate", icon: Globe2 },
    { key: "union", label: copy.union, match: "Union de l'Apostolat Catholique", icon: Cross },
    { key: "announce", label: copy.announce, match: isFrench ? "Communiqués" : "Announcements", icon: Megaphone },
    { key: "reflections", label: copy.reflections, match: isFrench ? "Réflexions" : "Reflections", icon: BookOpen },
    { key: "others", label: copy.others, match: "__others__", icon: Shapes },
  ];
  const knownMatches = categories.slice(1, 7).map((category) => category.match);
  const [activeKey, setActiveKey] = useState<CategoryKey>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const activeCategory = categories.find((item) => item.key === activeKey)!;
  const filtered = activeKey === "all"
    ? articles
    : activeCategory.match === "__others__"
      ? articles.filter((article) => !knownMatches.some((match) => article.tags.includes(match)))
      : articles.filter((article) => article.tags.includes(activeCategory.match));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const lastVisiblePage = Math.min(totalPages, firstVisiblePage + 4);
  const visiblePages = Array.from({ length: lastVisiblePage - firstVisiblePage + 1 }, (_, index) => firstVisiblePage + index);
  const pageArticles = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasMagazineLayout = page === 1 && activeKey === "all";
  const featured = hasMagazineLayout ? pageArticles[0] : undefined;
  const cardArticles = hasMagazineLayout ? pageArticles.slice(1, 4) : pageArticles;
  const listArticles = hasMagazineLayout ? pageArticles.slice(4) : [];

  function handleFilter(key: CategoryKey) {
    setActiveKey(key);
    setCurrentPage(1);
  }

  function articleHref(article: Article) {
    return `/${lang}/news/${getArticleSegment(article)}`;
  }

  return (
    <section aria-label={copy.eyebrow}>
      <div className="mb-8 border-b border-[var(--cream3)] pb-5 md:mb-10">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-[var(--gold)]" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gold-dk)]">{copy.eyebrow}</h2>
          <span className="h-px flex-1 bg-[var(--cream3)]" />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={copy.eyebrow}>
          {categories.map(({ key, label, icon: Icon }) => {
            const count = key === "all"
              ? articles.length
              : key === "others"
                ? articles.filter((article) => !knownMatches.some((match) => article.tags.includes(match))).length
                : articles.filter((article) => article.tags.includes(categories.find((category) => category.key === key)!.match)).length;
            const selected = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => handleFilter(key)}
                className={`inline-flex min-h-10 items-center gap-2 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.11em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:px-4 ${selected ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--cream3)] bg-white text-[var(--mid)] hover:bg-[var(--cream2)]"}`}
              >
                <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{label}</span>
                <span className={`min-w-5 px-1 py-0.5 text-center text-[10px] tabular-nums ${selected ? "bg-white/15 text-white" : "bg-[var(--cream2)] text-[var(--red)]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {activeKey !== "all" && (
          <p className="mt-4 text-xs text-[var(--mid)]" aria-live="polite">
            {copy.results}: <span className="font-semibold text-[var(--red)]">{categories.find((category) => category.key === activeKey)?.label}</span>
            <span className="ml-2 text-[var(--gray)]">({filtered.length})</span>
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[var(--cream3)] bg-white px-6 py-16 text-center">
          <p className="font-serif text-xl text-[var(--dark)]">{copy.noResults}</p>
          <button type="button" onClick={() => handleFilter("all")} className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--red)] underline decoration-[var(--gold)] underline-offset-4">
            {copy.showAll}
          </button>
        </div>
      ) : (
        <>
          {featured && (
            <article className="mb-7 border border-[var(--cream3)] bg-white shadow-[0_8px_32px_rgba(58,31,10,0.07)] md:mb-9">
                <Link href={articleHref(featured)} className="group grid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)] lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative aspect-[16/10] min-h-64 overflow-hidden bg-[var(--cream2)] lg:aspect-auto lg:min-h-[360px]">
                  <Image src={featured.imageUrl} alt={featured.title} fill sizes="(max-width: 1023px) 100vw, 56vw" priority className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                  <span className="absolute left-4 top-4 bg-[var(--red)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gold)] sm:left-6 sm:top-6">{featured.date}</span>
                </div>
                <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
                  <p className="mb-3 text-[10px] font-bold uppercase leading-relaxed tracking-[0.18em] text-[var(--gold-dk)] line-clamp-2">{featured.tags}</p>
                  <h3 className="font-serif text-2xl font-bold leading-tight text-[var(--dark)] transition-colors group-hover:text-[var(--red)] sm:text-3xl">{featured.title}</h3>
                  <span className="my-5 h-px w-12 bg-[var(--gold)]" />
                  <p className="mb-6 max-w-xl text-sm leading-7 text-[var(--mid)] line-clamp-3">{featured.summary}</p>
                  <span className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--red)]">
                    {readMore}<ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </article>
          )}

          {cardArticles.length > 0 && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {cardArticles.map((article) => (
                <article key={article.id} className="group flex min-w-0 flex-col border border-[var(--cream3)] bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(58,31,10,0.09)]">
                  <Link href={articleHref(article)} className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
                    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--cream2)]">
                      <Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      <span className="absolute left-3 top-3 bg-[var(--red)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--gold)]">{article.date}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--gold-dk)] line-clamp-1">{article.tags}</p>
                      <h3 className="mb-3 font-serif text-base font-bold leading-snug text-[var(--dark)] transition-colors group-hover:text-[var(--red)] line-clamp-2">{article.title}</h3>
                      <p className="mb-4 text-sm leading-relaxed text-[var(--mid)] line-clamp-3">{article.summary}</p>
                      <span className="mt-auto inline-flex items-center gap-2 border-t border-[var(--cream3)] pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
                        {readMore}<ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {listArticles.length > 0 && (
            <section className="border border-[var(--cream3)] bg-white" aria-labelledby="all-publications-heading">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--cream3)] px-4 py-4 sm:px-6">
                <h2 id="all-publications-heading" className="border-l-2 border-[var(--red)] pl-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--dark)]">{allPublicationsLabel}</h2>
                <span className="text-[10px] font-medium text-[var(--gold-dk)]">{copy.page} {page} {isFrench ? "sur" : "of"} {totalPages}</span>
              </div>
              <div className="divide-y divide-[var(--cream3)]">
                {listArticles.map((article) => (
                  <article key={article.id}>
                    <Link href={articleHref(article)} className="group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--cream)] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--gold)] sm:gap-5 sm:px-6">
                      <div className="relative size-16 shrink-0 overflow-hidden bg-[var(--cream2)] sm:size-[76px]">
                        <Image src={article.imageUrl} alt="" fill sizes="76px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--gold-dk)]">{article.date}</p>
                        <h3 className="font-serif text-sm font-bold leading-snug text-[var(--dark)] transition-colors group-hover:text-[var(--red)] line-clamp-2">{article.title}</h3>
                        <p className="mt-1 text-xs text-[var(--gray)] line-clamp-1">{article.tags}</p>
                      </div>
                      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-[var(--gold-dk)] transition-transform group-hover:translate-x-1" />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {totalPages > 1 && (
            <nav aria-label={isFrench ? "Pagination des actualités" : "News pagination"} className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--cream3)] pt-5 sm:flex-row">
              <p className="text-xs text-[var(--mid)]" aria-live="polite">
                {copy.showing} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {isFrench ? "sur" : "of"} {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setCurrentPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label={copy.previous} className="inline-flex min-h-10 items-center gap-2 border border-[var(--cream3)] px-3 text-xs font-bold uppercase tracking-wider text-[var(--red)] hover:bg-[var(--cream2)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                  <ArrowLeft aria-hidden="true" className="size-4" /><span className="hidden sm:inline">{copy.previous}</span>
                </button>
                {firstVisiblePage > 1 && <>
                  <button type="button" onClick={() => setCurrentPage(1)} aria-label={`${copy.page} 1`} className="size-10 border border-[var(--cream3)] bg-white text-xs font-bold tabular-nums text-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">1</button>
                  {firstVisiblePage > 2 && <span aria-hidden="true" className="px-1 text-[var(--gray)]">…</span>}
                </>}
                {visiblePages.map((pageNumber) => (
                  <button key={pageNumber} type="button" onClick={() => setCurrentPage(pageNumber)} aria-label={`${copy.page} ${pageNumber}`} aria-current={pageNumber === page ? "page" : undefined} className={`size-10 border text-xs font-bold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${pageNumber === page ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--cream3)] bg-white text-[var(--red)] hover:bg-[var(--cream2)]"}`}>
                    {pageNumber}
                  </button>
                ))}
                {lastVisiblePage < totalPages && <>
                  {lastVisiblePage < totalPages - 1 && <span aria-hidden="true" className="px-1 text-[var(--gray)]">…</span>}
                  <button type="button" onClick={() => setCurrentPage(totalPages)} aria-label={`${copy.page} ${totalPages}`} className="size-10 border border-[var(--cream3)] bg-white text-xs font-bold tabular-nums text-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">{totalPages}</button>
                </>}
                <button type="button" onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label={copy.next} className="inline-flex min-h-10 items-center gap-2 border border-[var(--cream3)] px-3 text-xs font-bold uppercase tracking-wider text-[var(--red)] hover:bg-[var(--cream2)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                  <span className="hidden sm:inline">{copy.next}</span><ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
