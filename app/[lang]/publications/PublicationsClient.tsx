"use client";

import { useState, useMemo } from "react";

type Book = {
  id: number;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  color: string;
  textColor: string;
  url?: string;
};

const books: Book[] = [
  {
    id: 1,
    number: "PSF / 01",
    title: "INFO PSF",
    subtitle: "Provincial Newsletter",
    description: "The official newsletter of the Holy Family Province, keeping confreres and friends informed of community life, appointments, and apostolic activities.",
    category: "newsletter",
    color: "#5C3317",
    textColor: "#ffffff",
  },
  {
    id: 2,
    number: "PSF / 02",
    title: "COMMUNION",
    subtitle: "Pallottine Review",
    description: "A pastoral and spiritual review published by the Holy Family Province, deepening faith and sharing the Pallottine charisma with the wider Church.",
    category: "review",
    color: "#3A1F0A",
    textColor: "#C9952A",
  },
  {
    id: 3,
    number: "PSF / 03",
    title: "PROVINCIAL ASSEMBLY",
    subtitle: "Resolutions & Reports",
    description: "Official documents and resolutions adopted during the Provincial Assembly, guiding the apostolic mission of the Holy Family Province.",
    category: "official",
    color: "#7A4520",
    textColor: "#ffffff",
  },
  {
    id: 4,
    number: "PSF / 04",
    title: "APPOINTMENTS",
    subtitle: "Official Nominations",
    description: "Annual publication of confrere appointments and mission assignments within the Holy Family Province and beyond.",
    category: "official",
    color: "#C9952A",
    textColor: "#3A1F0A",
  },
  {
    id: 5,
    number: "PSF / 05",
    title: "FORMATION GUIDE",
    subtitle: "Formation & Mission",
    description: "Resources and guidelines for Pallottine formation houses, accompanying novices and seminarians in their journey toward priesthood and brotherhood.",
    category: "formation",
    color: "#2C4A1E",
    textColor: "#ffffff",
  },
  {
    id: 6,
    number: "PSF / 06",
    title: "PASTORAL NOTES",
    subtitle: "Pastoral Life",
    description: "Reflections, homilies, and pastoral resources produced by the priests and brothers of the Holy Family Province for the service of God's people.",
    category: "pastoral",
    color: "#1A3A5C",
    textColor: "#ffffff",
  },
];

const CATEGORIES = [
  { key: "all",       label: { en: "All Publications", fr: "Toutes les Publications" } },
  { key: "newsletter",label: { en: "Newsletter",        fr: "Bulletin" } },
  { key: "review",    label: { en: "Review",            fr: "Revue" } },
  { key: "official",  label: { en: "Official Documents",fr: "Documents Officiels" } },
  { key: "formation", label: { en: "Formation",         fr: "Formation" } },
  { key: "pastoral",  label: { en: "Pastoral",          fr: "Pastorale" } },
];

export default function PublicationsClient({ lang }: { lang: string }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const isFr = lang === "fr";

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchCat = activeCategory === "all" || b.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gray)]"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isFr ? "Rechercher des publications..." : "Search publications..."}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#e8e2d9] bg-white text-[var(--dark)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 mb-8 border-b border-[#e8e2d9] pb-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className="relative px-4 py-2.5 text-sm font-bold transition-colors"
            style={{
              color: activeCategory === cat.key ? "var(--red)" : "var(--gray)",
              borderBottom: activeCategory === cat.key ? "2px solid var(--red)" : "2px solid transparent",
              marginBottom: "-1px",
              background: "transparent",
            }}
          >
            {isFr ? cat.label.fr : cat.label.en}
          </button>
        ))}
      </div>

      {/* Book grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--gray)]">
          {isFr ? "Aucune publication trouvée." : "No publications found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map((book) => (
            <div key={book.id} className="group flex flex-col">
              {/* Book cover */}
              <div
                className="relative w-full rounded-lg overflow-hidden mb-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl cursor-pointer"
                style={{
                  paddingBottom: "140%",
                  background: book.color,
                  boxShadow: "4px 4px 20px rgba(0,0,0,0.25)",
                }}
                onClick={() => book.url && window.open(book.url, "_blank")}
              >
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  {/* Top: number */}
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase opacity-60"
                      style={{ color: book.textColor }}>
                      {book.number}
                    </p>
                  </div>
                  {/* Middle: title */}
                  <div className="text-center">
                    <p className="font-black text-sm leading-tight mb-2"
                      style={{ fontFamily: "Georgia, serif", color: book.textColor }}>
                      {book.title}
                    </p>
                    <div className="w-6 h-[2px] mx-auto opacity-50"
                      style={{ background: book.textColor }} />
                    <p className="text-[9px] font-bold tracking-[0.15em] uppercase mt-2 opacity-70"
                      style={{ color: book.textColor }}>
                      {book.subtitle}
                    </p>
                  </div>
                  {/* Bottom: SAC logo placeholder */}
                  <div>
                    <p className="text-[8px] font-bold tracking-widest uppercase opacity-40"
                      style={{ color: book.textColor }}>
                      SAC · PSF
                    </p>
                  </div>
                </div>
                {/* Spine shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-3 opacity-30"
                  style={{ background: "linear-gradient(to right, rgba(0,0,0,0.4), transparent)" }} />
              </div>

              {/* Book info */}
              <div className="flex-1 flex flex-col">
                <p className="font-bold text-sm text-[var(--dark)] mb-1"
                  style={{ fontFamily: "Georgia, serif" }}>
                  {book.title}
                </p>
                <p className="text-xs text-[var(--gray)] leading-relaxed mb-3 flex-1">
                  {book.description}
                </p>
                {book.url ? (
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.15em] text-[var(--red)] hover:text-[var(--gold)] transition-colors"
                  >
                    {isFr ? "Ouvrir" : "Open"} ↗
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.15em] text-[var(--gold)]/60">
                    {isFr ? "Bientôt disponible" : "Coming soon"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
