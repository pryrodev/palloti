"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, BookOpen, RotateCw } from "lucide-react";
import Link from "next/link";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePublications, type Publication } from "./publicationsQuery";
import { getPublicationSegment } from "@/lib/seoPaths";

const PdfViewer = dynamic(() => import("../../components/PdfViewer"), { ssr: false });
const PAGE_SIZE = 6;

export default function PublicationsClient({ lang }: { lang: string }) {
  const [page, setPage] = useState(1);
  const [openPdf, setOpenPdf] = useState<Publication | null>(null);
  const isFr = lang === "fr";
  const publicationsQuery = usePublications(page, PAGE_SIZE);
  const books = publicationsQuery.data?.items ?? [];
  const pagination = publicationsQuery.data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const activePage = Math.min(page, totalPages);

  return (
    <div>
      {openPdf?.url && (
        <PdfViewer
          url={openPdf.url}
          title={openPdf.title}
          number={`PSF / ${openPdf.number}`}
          onClose={() => setOpenPdf(null)}
        />
      )}

      <div className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--cream3)] pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-dk)]">{isFr ? "Bibliothèque provinciale" : "Provincial library"}</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-[var(--dark)]">{isFr ? "Ressources à consulter" : "Resources to explore"}</h2>
        </div>
        {!publicationsQuery.isLoading && !publicationsQuery.isError && (
          <span className="text-xs tabular-nums text-[var(--mid)]">{pagination?.total ?? 0} {isFr ? "publications" : "publications"}</span>
        )}
      </div>

      {publicationsQuery.isLoading && (
        <div className="grid gap-4 lg:grid-cols-2" aria-label={isFr ? "Chargement" : "Loading"}>
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-60 animate-pulse border border-[var(--cream3)] bg-white" />)}
        </div>
      )}

      {publicationsQuery.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 border border-[var(--cream3)] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--mid)]">{isFr ? "Les publications ne sont pas disponibles pour le moment." : "Publications could not be loaded right now."}</p>
          <button type="button" onClick={() => void publicationsQuery.refetch()} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--red)] hover:text-[var(--gold-dk)]">
            <RotateCw aria-hidden="true" className="size-4" />{isFr ? "Réessayer" : "Try again"}
          </button>
        </div>
      )}

      {!publicationsQuery.isLoading && !publicationsQuery.isError && books.length === 0 && (
        <p className="border border-[var(--cream3)] bg-white px-6 py-12 text-center font-serif text-lg text-[var(--mid)]">
          {isFr ? "Aucune publication n’est disponible." : "No publications are available yet."}
        </p>
      )}

      {!publicationsQuery.isLoading && !publicationsQuery.isError && books.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {books.map((book, index) => (
              <article
                key={book.id}
                className="relative group flex min-h-[220px] w-full min-w-0 items-stretch gap-3 border border-[var(--cream3)] bg-white p-3 transition-colors hover:bg-[var(--cream)] sm:min-h-[292px] sm:gap-5 sm:p-5 lg:min-h-[312px]"
              >
                <span className="absolute right-2 top-2 z-10 grid size-6 place-items-center border border-[var(--cream3)] bg-white text-[10px] font-bold tabular-nums text-[var(--gold-dk)]">{(pagination?.offset ?? 0) + index + 1}</span>
                {book.coverImage ? (
                  <div className="relative flex h-[194px] w-[112px] shrink-0 overflow-hidden shadow-[3px_4px_12px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:-translate-y-0.5 min-[380px]:h-[210px] min-[380px]:w-32 sm:h-[260px] sm:w-44 lg:h-[280px] lg:w-48 bg-[var(--cream2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={book.coverImage} alt={book.title} className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="relative flex h-[194px] w-[112px] shrink-0 flex-col justify-between overflow-hidden p-3 shadow-[3px_4px_12px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:-translate-y-0.5 min-[380px]:h-[210px] min-[380px]:w-32 min-[380px]:p-4 sm:h-[260px] sm:w-44 sm:p-5 lg:h-[280px] lg:w-48" style={{ background: book.color ?? "#5C3317" }}>
                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70" style={{ color: book.titleColor ?? "#ffffff" }}>PSF / {book.number}</span>
                    <span aria-hidden="true" className="absolute bottom-8 right-2 opacity-[0.12]"><BookOpen className="size-20" style={{ color: book.titleColor ?? "#ffffff" }} /></span>
                    <p className="relative line-clamp-5 break-words font-serif text-sm font-black leading-tight min-[380px]:text-base sm:text-lg" style={{ color: book.titleColor ?? "#ffffff" }}>{book.title}</p>
                    <p className="relative text-[8px] font-bold uppercase leading-relaxed tracking-[0.13em]" style={{ color: book.subtitleColor ?? "#C9952A" }}>{book.subtitle}</p>
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-black/15" />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col items-start justify-center py-1 text-left">
                  <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gold-dk)]">{isFr ? `Publication ${book.number}` : `Publication ${book.number}`}</span>
                  <Link href={`/${lang}/publications/${getPublicationSegment(book)}`} className="font-serif text-base font-bold leading-snug text-[var(--dark)] transition-colors hover:text-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:text-lg">{book.title}</Link>
                  <span className="mt-1 text-xs font-semibold leading-relaxed text-[var(--gold-dk)]">{book.subtitle}</span>
                  <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--mid)]">{book.description}</span>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <Link href={`/${lang}/publications/${getPublicationSegment(book)}`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--red)] hover:text-[var(--gold-dk)]">
                      {isFr ? "Détails" : "Details"}<ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                    {book.url && (
                      book.fileType === "image" ? (
                        <a href={book.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mid)] underline decoration-[var(--cream3)] underline-offset-4 hover:text-[var(--red)]">
                          {isFr ? "Voir le document" : "View Document"}
                        </a>
                      ) : (
                        <button type="button" onClick={() => setOpenPdf(book)} className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mid)] underline decoration-[var(--cream3)] underline-offset-4 hover:text-[var(--red)]">
                          {isFr ? "Ouvrir le PDF" : "Open PDF"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <PaginationControls page={activePage} totalPages={totalPages} totalItems={pagination?.total ?? 0} pageSize={PAGE_SIZE} itemLabel="publications" lang={lang} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
