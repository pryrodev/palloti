"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import enDictionary from "@/dictionaries/en.json";
import frDictionary from "@/dictionaries/fr.json";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/reui/frame";
import { DEFAULT_SITE_THEME, SITE_THEME_LABELS, type SiteTheme } from "@/lib/siteTheme";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import type { CmsPayload } from "@/lib/cmsSchemas";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";

type Locale = "en" | "fr";
type TextField = { path: (string | number)[]; label: string; value: string };
type HeroSlide = { image: string; location: string; title: string; subtitle: string };
type EditableDictionary = Record<string, unknown> & {
  home: Record<string, unknown> & { heroSlides: HeroSlide[]; rectorImage: string };
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
  "home.rectorImage",
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

function formatSectionLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/[._-]/g, " ");
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
  const editorSections = [...sections, "theme"];
  const allFields = collectTextFields(content);
  const visibleFields = allFields.filter((field) => {
    const inSection = search.trim() || field.path[0] === activeSection;
    const matchesSearch = !search.trim() || `${field.label} ${field.value}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    return inSection && matchesSearch;
  });
  const fieldGroups = visibleFields.reduce<Map<string, TextField[]>>((groups, field) => {
    const groupKey = field.path.length > 2 && typeof field.path[1] === "string" ? field.path[1] : "pageCopy";
    const group = groups.get(groupKey) ?? [];
    group.push(field);
    groups.set(groupKey, group);
    return groups;
  }, new Map());
  const isThemeSection = activeSection === "theme" && !search.trim();

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

  function updateRectorImage(image: string) {
    updateCopy(["home", "rectorImage"], image);
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

  async function deleteHeroSlide(index: number) {
    if (saveCollection.isPending) return false;
    const localizedDraft = draft[locale];
    const nextDraft: SiteContent = {
      ...draft,
      [locale]: {
        ...localizedDraft,
        home: {
          ...localizedDraft.home,
          heroSlides: localizedDraft.home.heroSlides.filter((_, slideIndex) => slideIndex !== index),
        },
      },
    };
    setMessage("");
    try {
      const saved = await saveCollection.mutateAsync(nextDraft);
      setDraft(nextDraft);
      serverSnapshot.current = JSON.stringify(nextDraft);
      serverRevision.current = saved.revision;
      setMessage("Hero slide deleted.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete this hero slide.");
      return false;
    }
  }

  return (
    <div className="flex max-w-6xl flex-col gap-3">
      <Frame spacing="sm" className="[--frame-radius:0px] [--frame-panel-radius:0px]">
        <FramePanel fit className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Site content</h2>
              <p className="text-xs text-muted-foreground">Edit public copy, hero slides, and brand colors.</p>
            </div>
            <Button
              type="button"
              size="sm"
              className="bg-[#5C3317] text-white hover:bg-[#70411e]"
              style={{ backgroundColor: "#5C3317", color: "#fff" }}
              onClick={save}
              disabled={saveCollection.isPending}
            >
              {saveCollection.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["en", "fr"] as const).map((item) => (
              <Button key={item} type="button" size="sm" variant={locale === item ? "default" : "outline"} aria-pressed={locale === item} onClick={() => setLocale(item)}>
                {item.toUpperCase()}
              </Button>
            ))}
            <label className="ml-auto min-w-48 flex-1 sm:max-w-sm">
              <span className="sr-only">Search copy</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search copy" className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
            </label>
          </div>
        </FramePanel>
      </Frame>

      {message && <p role="status" aria-live="polite" className="border border-border bg-card px-3 py-2 text-sm text-foreground">{message}</p>}
      {query.error && <p role="alert" className="border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-foreground">Could not load saved copy. The committed English and French text is open; saving creates its CMS record when the database is available.</p>}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Site content sections" className="flex min-w-0 gap-1 overflow-x-auto xl:flex-col xl:overflow-visible">
          {editorSections.map((section) => {
            const selected = !search && activeSection === section;
            return <button
              key={section}
              type="button"
              onClick={() => { setActiveSection(section); setSearch(""); }}
              aria-current={selected ? "location" : undefined}
              className={`shrink-0 border px-3 py-2 text-left text-xs font-semibold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:w-full ${selected ? "border-border bg-muted text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
            >
              {section === "theme" ? "Brand colors" : formatSectionLabel(section)}
            </button>;
          })}
        </nav>

        <main className="min-w-0">
          {isThemeSection ? <section aria-labelledby="site-colors-heading">
            <Frame spacing="sm" className="[--frame-radius:0px] [--frame-panel-radius:0px]">
              <FramePanel fit>
                <div className="mb-4">
                  <h3 id="site-colors-heading" className="text-sm font-semibold text-foreground">Brand colors</h3>
                  <p className="text-xs text-muted-foreground">Palette values used across the public site.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {(Object.keys(SITE_THEME_LABELS) as (keyof SiteTheme)[]).map((key) => (
                    <label key={key} className="flex min-w-0 items-center gap-3 border border-border bg-background p-2">
                      <input type="color" value={draft.theme[key]} onChange={(event) => updateTheme(key, event.target.value.toUpperCase())} aria-label={`${SITE_THEME_LABELS[key]} color`} className="size-9 shrink-0 cursor-pointer border-0 bg-transparent p-0" />
                      <span className="min-w-0 flex-1 text-xs font-medium text-foreground">{SITE_THEME_LABELS[key]}</span>
                      <input value={draft.theme[key]} onChange={(event) => updateTheme(key, event.target.value)} pattern="^#[0-9a-fA-F]{6}$" aria-label={`${SITE_THEME_LABELS[key]} hex value`} className="w-20 border border-input bg-background px-2 py-1.5 font-mono text-xs uppercase text-foreground" />
                    </label>
                  ))}
                </div>
              </FramePanel>
            </Frame>
          </section> : <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground" role="status">
              {visibleFields.length} text fields{search ? " match your search" : ` in ${formatSectionLabel(activeSection)}`}
            </p>

            {!search && activeSection === "home" && <Frame spacing="sm" stacked className="[--frame-radius:0px] [--frame-panel-radius:0px]">
              <FramePanel fit>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative h-28 w-24 shrink-0 border border-border bg-muted">
                    <Image src={draft[locale].home.rectorImage} alt="Provincial Rector" fill sizes="96px" unoptimized className="object-cover object-top" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Rector portrait</h3>
                      <p className="max-w-md break-all text-xs text-muted-foreground">{draft[locale].home.rectorImage}</p>
                    </div>
                    <div>
                      <CloudinaryMediaPicker label="Choose portrait" resourceType="image" onSelect={(asset) => updateRectorImage(asset.secureUrl || asset.url)} />
                    </div>
                  </div>
                </div>
              </FramePanel>
              <FramePanel fit>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Hero slides</h3>
                    <p className="text-xs text-muted-foreground">Images and copy shown together in the home slider.</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => updateHeroSlides([...draft[locale].home.heroSlides, { image: "", location: "", title: "", subtitle: "" }])}>
                    Add slide
                  </Button>
                </div>
              </FramePanel>
              {(draft[locale].home.heroSlides as HeroSlide[]).map((slide, index, slides) => (
                <FramePanel key={index} fit>
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      Slide {index + 1}{slide.title ? ` — ${slide.title}` : " — Untitled"}
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(["location", "title", "subtitle"] as const).map((field) => (
                        <label key={field} className="block text-xs font-medium text-muted-foreground">
                          {field === "location" ? "Location label" : formatSectionLabel(field)}
                          <input value={slide[field]} onChange={(event) => updateHeroSlides(slides.map((item, slideIndex) => slideIndex === index ? { ...item, [field]: event.target.value } : item))} className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
                        </label>
                      ))}
                      <div className="flex min-w-0 flex-wrap items-end gap-2">
                        {slide.image && <span className="max-w-full truncate text-xs text-muted-foreground" title={slide.image}>{slide.image}</span>}
                        <CloudinaryMediaPicker label="Choose slide image" resourceType="image" onSelect={(asset) => updateHeroSlides(slides.map((item, slideIndex) => slideIndex === index ? { ...item, image: asset.secureUrl || asset.url } : item))} />
                        <ConfirmDeleteAction
                          title="Are you sure?"
                          description={`You are about to delete the home page slide “${slide.title || `Slide ${index + 1}`}”. This action cannot be undone.`}
                          confirmLabel="Delete"
                          disabled={slides.length <= 1}
                          onConfirm={() => deleteHeroSlide(index)}
                        >
                          Remove
                        </ConfirmDeleteAction>
                      </div>
                    </div>
                  </details>
                </FramePanel>
              ))}
            </Frame>}

            {fieldGroups.size > 0 ? <Frame spacing="sm" stacked className="[--frame-radius:0px] [--frame-panel-radius:0px]">
              {[...fieldGroups.entries()].map(([group, fields], groupIndex) => (
                <FramePanel key={group} fit>
                  <details open={groupIndex === 0}>
                    <summary className="cursor-pointer text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      {group === "pageCopy" ? "Page copy" : formatSectionLabel(group)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{fields.length}</span>
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {fields.map((field) => (
                        <label key={field.path.join(".")} className={`block min-w-0 border border-border bg-background p-2.5 ${field.value.length > 140 ? "md:col-span-2" : ""}`}>
                          <span className="mb-1.5 block truncate text-xs font-medium text-muted-foreground" title={field.label}>{field.label}</span>
                          {field.value.length > 140 ? (
                            <textarea value={field.value} rows={3} onChange={(event) => updateCopy(field.path, event.target.value)} className="w-full resize-y border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
                          ) : (
                            <input value={field.value} onChange={(event) => updateCopy(field.path, event.target.value)} className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
                          )}
                        </label>
                      ))}
                    </div>
                  </details>
                </FramePanel>
              ))}
            </Frame> : <div className="border border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground">No text fields match this search.</div>}
          </div>}
        </main>
      </div>
    </div>
  );
}
