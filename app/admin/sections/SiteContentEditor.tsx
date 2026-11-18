"use client";

import { useEffect, useRef, useState } from "react";
import enDictionary from "@/dictionaries/en.json";
import frDictionary from "@/dictionaries/fr.json";
import { DEFAULT_SITE_THEME, SITE_THEME_LABELS, type SiteTheme } from "@/lib/siteTheme";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import type { CmsPayload } from "@/lib/cmsSchemas";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";

type Locale = "en" | "fr";
type TextField = { path: (string | number)[]; label: string; value: string };
type HeroSlide = { image: string; location: string; title: string; subtitle: string };
type EditableDictionary = Record<string, unknown> & {
  home: Record<string, unknown> & { heroSlides: HeroSlide[] };
};
type SiteContent = Omit<CmsPayload<"siteContent">, "en" | "fr"> & { en: EditableDictionary; fr: EditableDictionary };

const DEFAULT_CONTENT: SiteContent = {
  en: enDictionary as unknown as EditableDictionary,
  fr: frDictionary as unknown as EditableDictionary,
  theme: { ...DEFAULT_SITE_THEME },
};
const DYNAMIC_CONTENT_PATHS = new Set([
  "newsSection.articles",
  "communities.items",
  "direction.members",
  "home.newsItems",
  "home.heroSlides",
]);

function collectTextFields(value: unknown, path: (string | number)[] = []): TextField[] {
  if (typeof value === "string") {
    const keyPath = path.map(String).join(".");
    if ([...DYNAMIC_CONTENT_PATHS].some((dynamicPath) => keyPath === dynamicPath || keyPath.startsWith(`${dynamicPath}.`))) return [];
    return [{ path, label: path.map((part) => typeof part === "number" ? `Item ${part + 1}` : part).join(" / "), value }];
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => collectTextFields(item, [...path, index]));
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => collectTextFields(child, [...path, key]));
  }
  return [];
}

function setTextAtPath(value: unknown, path: (string | number)[], text: string): unknown {
  if (path.length === 0) return text;
  const [head, ...tail] = path;
  if (Array.isArray(value) && typeof head === "number") {
    return value.map((item, index) => index === head ? setTextAtPath(item, tail, text) : item);
  }
  if (typeof value === "object" && value !== null && typeof head === "string") {
    const record = value as Record<string, unknown>;
    return { ...record, [head]: setTextAtPath(record[head], tail, text) };
  }
  return value;
}

export default function SiteContentEditor() {
  const [draft, setDraft] = useState<SiteContent>(DEFAULT_CONTENT);
  const [locale, setLocale] = useState<Locale>("en");
  const [activeSection, setActiveSection] = useState("home");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);
  const query = useCmsCollection<SiteContent>("siteContent");
  const saveCollection = useSaveCmsCollection<SiteContent>("siteContent", () => serverRevision.current);

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const currentDraft = JSON.stringify(draft);
    if (serverSnapshot.current === null) {
      setDraft(query.data);
      serverSnapshot.current = incoming;
      serverRevision.current = query.revision ?? null;
    } else if (currentDraft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) {
        setDraft(query.data);
        serverSnapshot.current = incoming;
      }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, draft]);

  const content = draft[locale] as Record<string, unknown>;
  const sections = Object.keys(content).filter((key) => !DYNAMIC_CONTENT_PATHS.has(key) && typeof content[key] === "object");
  const allFields = collectTextFields(content);
  const visibleFields = allFields.filter((field) => {
    const inSection = search.trim() || field.path[0] === activeSection;
    const matchesSearch = !search.trim() || `${field.label} ${field.value}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    return inSection && matchesSearch;
  });

  function updateCopy(path: (string | number)[], value: string) {
    setDraft((current) => ({ ...current, [locale]: setTextAtPath(current[locale], path, value) as Record<string, unknown> }));
  }

  function updateTheme(key: keyof SiteTheme, value: string) {
    setDraft((current) => ({ ...current, theme: { ...current.theme, [key]: value } }));
  }

  function updateHeroSlides(slides: HeroSlide[]) {
    setDraft((current) => ({
      ...current,
      [locale]: {
        ...current[locale],
        home: { ...current[locale].home, heroSlides: slides },
      },
    }));
  }

  async function save() {
    setMessage("");
    try {
      const saved = await saveCollection.mutateAsync(draft);
      serverSnapshot.current = JSON.stringify(draft);
      serverRevision.current = saved.revision;
      setMessage("Site content and theme saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save site content.");
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800">Public site content</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">Edit page copy and brand colors here. News, communities, direction, gallery, videos, and publications keep their dedicated editors.</p>
        </div>
        <button type="button" onClick={save} disabled={saveCollection.isPending} className="bg-[#5C3317] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {saveCollection.isPending ? "Saving…" : "Save site changes"}
        </button>
      </div>

      {message && <p role="status" className="mb-4 border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700">{message}</p>}
      {query.error && <p className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Could not load the saved site copy. The committed English and French copy is open; saving will create the CMS record if the database is available.</p>}

      <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
        {(["en", "fr"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setLocale(item)} aria-pressed={locale === item} className={`px-4 py-2 text-xs font-bold ${locale === item ? "bg-[#5C3317] text-white" : "bg-white text-gray-600"}`}>
            {item.toUpperCase()}
          </button>
        ))}
        <label className="ml-auto flex min-w-48 flex-1 items-center gap-2 sm:max-w-sm">
          <span className="sr-only">Search copy</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search text and field names" className="w-full border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C9952A]" />
        </label>
      </div>

      <div className="grid gap-8 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Site content sections" className="flex flex-wrap content-start gap-2 xl:flex-col">
          {sections.map((section) => (
            <button key={section} type="button" onClick={() => { setActiveSection(section); setSearch(""); }} aria-pressed={!search && activeSection === section} className={`border px-3 py-2 text-left text-xs font-bold capitalize ${!search && activeSection === section ? "border-[#5C3317] bg-[#5C3317] text-white" : "border-gray-200 bg-white text-gray-700"}`}>
              {section.replace(/([A-Z])/g, " $1").replace(/[._-]/g, " ")}
            </button>
          ))}
        </nav>

        <div className="space-y-3">
          <p className="mb-3 text-xs font-semibold text-gray-500">{visibleFields.length} editable text fields{search ? " match your search" : ` in ${activeSection}`}</p>
          {!search && activeSection === "home" && (
            <section aria-labelledby="hero-slides-heading" className="mb-7 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 id="hero-slides-heading" className="text-sm font-black text-gray-800">Home hero slides</h3>
                  <p className="mt-1 text-xs text-gray-500">Edit the image and story shown together in the home page slider.</p>
                </div>
                <button type="button" onClick={() => updateHeroSlides([...draft[locale].home.heroSlides, { image: "", location: "", title: "", subtitle: "" }])} className="border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:border-[#C9952A]">Add slide</button>
              </div>
              {(draft[locale].home.heroSlides as HeroSlide[]).map((slide, index, slides) => (
                <article key={`${index}-${slide.title}`} className="border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Slide {index + 1}</h4>
                    <button type="button" disabled={slides.length <= 1} onClick={() => updateHeroSlides(slides.filter((_, slideIndex) => slideIndex !== index))} className="text-xs font-bold text-red-700 disabled:opacity-40">Remove</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["location", "title", "subtitle"] as const).map((field) => (
                      <label key={field} className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {field === "location" ? "Location label" : field}
                        <input value={slide[field]} onChange={(event) => updateHeroSlides(slides.map((item, slideIndex) => slideIndex === index ? { ...item, [field]: event.target.value } : item))} className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-800 outline-none focus:border-[#C9952A]" />
                      </label>
                    ))}
                    <div className="flex items-end gap-2">
                      {slide.image && <span className="max-w-40 truncate text-xs text-gray-500">{slide.image}</span>}
                      <CloudinaryMediaPicker label="Choose slide image" resourceType="image" onSelect={(asset) => updateHeroSlides(slides.map((item, slideIndex) => slideIndex === index ? { ...item, image: asset.secureUrl || asset.url } : item))} />
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
          {visibleFields.map((field) => (
            <label key={field.path.join(".")} className="block border border-gray-200 bg-white p-3">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{field.label}</span>
              {field.value.length > 140 ? (
                <textarea value={field.value} rows={4} onChange={(event) => updateCopy(field.path, event.target.value)} className="w-full resize-y border border-gray-200 px-3 py-2 text-sm leading-relaxed text-gray-800 outline-none focus:border-[#C9952A]" />
              ) : (
                <input value={field.value} onChange={(event) => updateCopy(field.path, event.target.value)} className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#C9952A]" />
              )}
            </label>
          ))}
          {visibleFields.length === 0 && <p className="border border-gray-200 bg-white px-4 py-8 text-sm text-gray-500">No text fields match this search.</p>}
        </div>
      </div>

      <section className="mt-10 border-t border-gray-200 pt-7" aria-labelledby="site-colors-heading">
        <div className="mb-5">
          <h3 id="site-colors-heading" className="text-lg font-black text-gray-800">Brand colors</h3>
          <p className="mt-1 text-sm text-gray-500">These palette values feed the shared site color tokens.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(SITE_THEME_LABELS) as (keyof SiteTheme)[]).map((key) => (
            <label key={key} className="flex items-center gap-3 border border-gray-200 bg-white p-3">
              <input type="color" value={draft.theme[key]} onChange={(event) => updateTheme(key, event.target.value.toUpperCase())} aria-label={`${SITE_THEME_LABELS[key]} color`} className="size-10 cursor-pointer border-0 bg-transparent p-0" />
              <span className="min-w-0 flex-1 text-xs font-semibold text-gray-700">{SITE_THEME_LABELS[key]}</span>
              <input value={draft.theme[key]} onChange={(event) => updateTheme(key, event.target.value)} pattern="^#[0-9a-fA-F]{6}$" aria-label={`${SITE_THEME_LABELS[key]} hex value`} className="w-24 border border-gray-200 px-2 py-1.5 font-mono text-xs uppercase text-gray-700" />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
