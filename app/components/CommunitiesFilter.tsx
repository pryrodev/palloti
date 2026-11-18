"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, ChevronLeft, ChevronRight, MapPin, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Member = { name: string; role: string };
type Community = {
  id: string;
  name: string;
  location: string;
  region: string;
  description: string;
  works: string[];
  image?: string;
  members?: Member[];
  memberSummary?: string;
};

type Props = {
  communities: Community[];
  labels: {
    all: string;
    rwanda: string;
    drc: string;
    belgium: string;
    mission: string;
    members: string;
    works: string;
    viewDetails: string;
    hideDetails: string;
    imageUnavailable: string;
    showing: string;
    of: string;
    results: string;
    previous: string;
    next: string;
    page: string;
  };
};

const REGIONS = ["all", "rwanda", "drc", "belgium", "mission"] as const;
const ITEMS_PER_PAGE = 6;

export default function CommunitiesFilter({ communities, labels }: Props) {
  const [active, setActive] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const filtered = active === "all"
    ? communities
    : communities.filter((community) => community.region === active);

  const counts: Record<string, number> = { all: communities.length };
  for (const region of REGIONS.slice(1)) {
    counts[region] = communities.filter((community) => community.region === region).length;
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * ITEMS_PER_PAGE;
  const visibleCommunities = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2 md:mb-12">
        {REGIONS.map((region) => (
          <button
            key={region}
            type="button"
            aria-pressed={active === region}
            onClick={() => {
              setActive(region);
              setCurrentPage(1);
              setSelectedCommunity(null);
            }}
            className="flex min-h-10 items-center gap-2 border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:px-5"
            style={active === region
              ? { background: "var(--red)", color: "#ffffff", borderColor: "var(--red)" }
              : { background: "var(--cream)", color: "var(--mid)", borderColor: "var(--cream3)" }}
          >
            {labels[region]}
            <span
              className="px-1.5 py-0.5 text-xs font-bold tabular-nums"
              style={active === region
                ? { background: "rgba(255,255,255,0.18)", color: "#ffffff" }
                : { background: "var(--cream2)", color: "var(--red)" }}
            >
              {counts[region]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {visibleCommunities.map((community, index) => (
          <article key={community.id} className="card flex h-full min-w-0 flex-col">
            {community.image ? (
              <div className="group relative aspect-[16/9] overflow-hidden bg-[var(--cream2)]">
                <Image
                  src={community.image}
                  alt={community.name}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 bg-[var(--gold)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--dark)]">
                  {labels[community.region as keyof typeof labels]}
                </span>
              </div>
            ) : (
              <div className="group relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-[var(--cream3)] bg-[var(--cream)]">
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(201,151,39,0.16),transparent_58%),linear-gradient(135deg,var(--cream)_0%,var(--cream2)_100%)]" />
                <span aria-hidden="true" className="absolute -right-3 -top-10 select-none font-serif text-[10rem] font-bold leading-none text-[var(--gold)] opacity-[0.08]">
                  {String(pageStart + index + 1).padStart(2, "0")}
                </span>
                <div className="relative flex flex-col items-center gap-2 text-center">
                  <span className="flex size-14 items-center justify-center border border-[var(--gold)]/40 bg-white/70 text-[var(--gold-dk)] shadow-sm">
                    <Building2 aria-hidden="true" className="size-7" strokeWidth={1.5} />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold-dk)]">
                    {labels.imageUnavailable}
                  </span>
                </div>
                <span className="absolute bottom-3 left-4 bg-[var(--gold)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--dark)]">
                  {labels[community.region as keyof typeof labels]}
                </span>
              </div>
            )}

            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <h3 className="mb-2 text-lg font-bold leading-snug text-[var(--red)]" style={{ fontFamily: "Georgia, serif" }}>
                {community.name}
              </h3>
              <p className="mb-3 flex items-start gap-2 text-xs font-semibold uppercase leading-relaxed tracking-[0.08em] text-[var(--gold-dk)] sm:text-sm">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>{community.location}</span>
              </p>
              <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-[var(--mid)]">
                {community.description}
              </p>

              {community.works.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--gray)]">{labels.works}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {community.works.map((work) => (
                      <span
                        key={work}
                        className="border border-[var(--cream3)] bg-[var(--cream2)] px-2 py-1 text-xs leading-snug text-[var(--red)]"
                      >
                        {work}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {community.members && community.members.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-auto w-full justify-between border-[var(--cream3)] text-[var(--red)] hover:bg-[var(--cream)]"
                  onClick={() => setSelectedCommunity(community)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Users aria-hidden="true" />
                    {labels.viewDetails}
                  </span>
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      {filtered.length > 0 && (
        <nav aria-label={labels.results} className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--cream3)] pt-5 sm:flex-row">
          <p aria-live="polite" className="text-sm text-[var(--mid)]">
            {labels.showing} {pageStart + 1}–{Math.min(pageStart + ITEMS_PER_PAGE, filtered.length)} {labels.of} {filtered.length} {labels.results}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 1}
                aria-label={labels.previous}
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                className="border-[var(--cream3)] text-[var(--red)] disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" />
                <span className="hidden sm:inline">{labels.previous}</span>
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  type="button"
                  variant={pageNumber === page ? "default" : "outline"}
                  size="icon-sm"
                  aria-label={`${labels.page} ${pageNumber}`}
                  aria-current={pageNumber === page ? "page" : undefined}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={pageNumber === page
                    ? "bg-[var(--red)] text-white hover:bg-[var(--red)]/90"
                    : "border-[var(--cream3)] text-[var(--red)]"}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                aria-label={labels.next}
                onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                className="border-[var(--cream3)] text-[var(--red)] disabled:opacity-40"
              >
                <span className="hidden sm:inline">{labels.next}</span>
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </nav>
      )}

      <Sheet open={selectedCommunity !== null} onOpenChange={(open) => !open && setSelectedCommunity(null)}>
        <SheetContent
          side="right"
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <SheetHeader className="border-b border-[var(--cream3)] pr-14">
            <SheetTitle className="font-serif text-xl font-bold tracking-tight text-[var(--red)]">
              {selectedCommunity?.name ?? labels.members}
            </SheetTitle>
            {selectedCommunity && (
              <SheetDescription className="text-[var(--mid)]">
                {selectedCommunity.location}
              </SheetDescription>
            )}
            <SheetClose
              render={<Button type="button" variant="ghost" size="icon-sm" aria-label={labels.hideDetails} className="absolute right-3 top-3" />}
            >
              <X aria-hidden="true" />
            </SheetClose>
          </SheetHeader>

          {selectedCommunity && (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
              {selectedCommunity.memberSummary && (
                <p className="mb-6 border-l-2 border-[var(--gold)] pl-4 text-sm leading-relaxed text-[var(--mid)]">
                  {selectedCommunity.memberSummary}
                </p>
              )}

              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--red)]">{labels.members}</h3>
                <span className="text-xs font-semibold tabular-nums text-[var(--gray)]">
                  {selectedCommunity.members?.length ?? 0}
                </span>
              </div>

              <ol className="flex flex-col divide-y divide-[var(--cream3)]">
                {selectedCommunity.members?.map((member, index) => (
                  <li key={`${member.name}-${index}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4">
                    <span className="flex size-8 items-center justify-center bg-[var(--cream2)] text-xs font-bold tabular-nums text-[var(--red)]" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug text-[var(--dark)]">{member.name}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--mid)]">{member.role}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
