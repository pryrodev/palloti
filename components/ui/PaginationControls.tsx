import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  lang: string;
  onPageChange: (page: number) => void;
};

export default function PaginationControls({ page, totalPages, totalItems, pageSize, itemLabel, lang, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  const isFrench = lang === "fr";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const lastVisiblePage = Math.min(totalPages, firstVisiblePage + 4);
  const visiblePages = Array.from({ length: lastVisiblePage - firstVisiblePage + 1 }, (_, index) => firstVisiblePage + index);

  return (
    <nav aria-label={isFrench ? "Navigation des pages" : "Page navigation"} className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--cream3)] pt-5 sm:flex-row">
      <p className="text-xs text-[var(--mid)]" aria-live="polite">
        {isFrench ? "Affichage" : "Showing"} {start}–{end} {isFrench ? "sur" : "of"} {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} aria-label={isFrench ? "Page précédente" : "Previous page"} className="inline-flex min-h-10 items-center gap-2 border border-[var(--cream3)] px-3 text-xs font-bold uppercase tracking-wider text-[var(--red)] hover:bg-[var(--cream2)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
          <ChevronLeft aria-hidden="true" className="size-4" /><span className="hidden sm:inline">{isFrench ? "Précédent" : "Previous"}</span>
        </button>
        {firstVisiblePage > 1 && <>
          <PageButton pageNumber={1} page={page} lang={lang} onPageChange={onPageChange} />
          {firstVisiblePage > 2 && <span aria-hidden="true" className="px-1 text-[var(--gray)]">…</span>}
        </>}
        {visiblePages.map((pageNumber) => (
          <PageButton key={pageNumber} pageNumber={pageNumber} page={page} lang={lang} onPageChange={onPageChange} />
        ))}
        {lastVisiblePage < totalPages && <>
          {lastVisiblePage < totalPages - 1 && <span aria-hidden="true" className="px-1 text-[var(--gray)]">…</span>}
          <PageButton pageNumber={totalPages} page={page} lang={lang} onPageChange={onPageChange} />
        </>}
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label={isFrench ? "Page suivante" : "Next page"} className="inline-flex min-h-10 items-center gap-2 border border-[var(--cream3)] px-3 text-xs font-bold uppercase tracking-wider text-[var(--red)] hover:bg-[var(--cream2)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
          <span className="hidden sm:inline">{isFrench ? "Suivant" : "Next"}</span><ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
}

function PageButton({ pageNumber, page, lang, onPageChange }: { pageNumber: number; page: number; lang: string; onPageChange: (page: number) => void }) {
  return (
    <button type="button" onClick={() => onPageChange(pageNumber)} aria-label={`${lang === "fr" ? "Page" : "Page"} ${pageNumber}`} aria-current={pageNumber === page ? "page" : undefined} className={`size-10 border text-xs font-bold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${pageNumber === page ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--cream3)] bg-white text-[var(--red)] hover:bg-[var(--cream2)]"}`}>
      {pageNumber}
    </button>
  );
}
