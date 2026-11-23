"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import enDictionary from "@/dictionaries/en.json";
import frDictionary from "@/dictionaries/fr.json";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Frame, FramePanel } from "@/components/reui/frame";
import { DEFAULT_SITE_THEME, SITE_THEME_LABELS, type SiteTheme } from "@/lib/siteTheme";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import type { CmsPayload } from "@/lib/cmsSchemas";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";
import RichTextEditor from "./RichTextEditor";

type Locale = "en" | "fr";
type TextField = { path: (string | number)[]; label: string; value: string };
type HeroSlide = { image: string; location: string; title: string; subtitle: string };
type RectorTextField = "welcomeBadge" | "welcomeTitle" | "rectorName" | "rectorTitle" | "rectorQuote";
type HomeContent = Record<string, unknown> & {
  heroSlides: HeroSlide[];
  rectorImage: string;
  welcomeBadge: string;
  welcomeTitle: string;
  rectorName: string;
  rectorTitle: string;
  rectorQuote: string;
  welcomeBody: string[] | string;
};
type FounderContent = Record<string, unknown> & {
  badge?: string;
  title?: string;
  subtitle?: string;
  biography?: string[] | string;
  quote?: string;
  quoteAuthor?: string;
};
type EditableDictionary = Record<string, unknown> & {
  home: HomeContent;
  founder?: FounderContent;
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
  "home.welcomeBadge",
  "home.welcomeTitle",
  "home.rectorName",
  "home.rectorTitle",
  "home.rectorQuote",
  "home.welcomeBody",
  "founder.biography",
]);
const SECTION_LABELS: Record<string, string> = {
  home: "Home page",
  hero: "Hero section",
  founder: "Founder",
  history: "History",
  charisma: "Charisma",
  direction: "Provincial direction",
  communities: "Communities",
  newsSection: "News section",
  galleries: "Gallery page",
  contactPage: "Contact page",
  navigation: "Navigation",
  footer: "Footer",
  newsletter: "Newsletter",
  siteSeo: "SEO & metadata",
  theme: "Brand colors",
};
const SECTION_DESCRIPTIONS: Record<string, string> = {
  home: "Edit the homepage message, slides, and supporting copy.",
  hero: "Edit the headline and buttons used at the top of public pages.",
  founder: "Edit the founder page text and quotations.",
  history: "Edit historical page headings and chapters.",
  charisma: "Edit the Charism page copy and image.",
  direction: "Edit page labels; leadership profiles are managed separately.",
  communities: "Edit page labels; community profiles are managed separately.",
  newsSection: "Edit news page labels; articles are managed separately.",
  galleries: "Edit gallery page labels and manage its photos separately.",
  contactPage: "Edit contact details, form labels, and messages.",
  navigation: "Edit the labels shown in the site navigation.",
  footer: "Edit footer text and contact details.",
  newsletter: "Edit newsletter form copy and status messages.",
  siteSeo: "Edit page titles and descriptions used by search engines.",
};
const FIELD_LABELS: Record<string, string> = {
  badge: "Section label",
  heroBadge: "Hero label",
  welcomeBadge: "Rector section label",
  heroTitle: "Hero title",
  welcomeTitle: "Rector message heading",
  rectorName: "Rector name",
  rectorTitle: "Rector role",
  rectorQuote: "Rector quote",
  rectorImage: "Rector portrait",
  missionQuote: "Mission quote",
  missionAuthor: "Quote attribution",
  ctaPrimary: "Primary button label",
  ctaSecondary: "Secondary button label",
  viewAllNews: "View all news label",
  readStory: "Read story label",
  readMore: "Read more label",
  homeTitle: "Home page title",
  homeDescription: "Home page description",
  newsTitle: "News page title",
  newsDescription: "News page description",
  publicationsTitle: "Publications page title",
  publicationsDescription: "Publications page description",
  addressLabel: "Address label",
  phoneLabel: "Phone label",
  mapTitle: "Map title",
  openMap: "Open map label",
  deliveryNote: "Delivery note",
  quickLinks: "Quick links",
  image: "Section image",
  address: "Address",
  phone: "Phone number",
  email: "Email address",
  name: "Name",
  subject: "Subject",
  message: "Message",
  send: "Submit button label",
  sending: "Submitting label",
  rights: "Copyright text",
  success: "Success message",
};
const COLLECTION_SHORTCUTS: Record<string, { description: string; label: string; href: string }> = {
  home: { description: "Homepage news cards use the latest articles.", label: "Manage news", href: "/admin/news" },
  communities: { description: "Community profiles and member lists are managed separately.", label: "Manage communities", href: "/admin/communities" },
  direction: { description: "Provincial leadership profiles are managed separately.", label: "Manage direction", href: "/admin/direction" },
  newsSection: { description: "News articles and publication cards are managed separately.", label: "Manage news", href: "/admin/news" },
  galleries: { description: "Gallery photos are managed in the Gallery section.", label: "Manage gallery", href: "/admin/gallery" },
};
const SECTION_GROUPS = [
  { label: "Public pages", sections: ["home", "hero", "founder", "history", "charisma"] },
  { label: "Community & news", sections: ["direction", "communities", "newsSection", "galleries"] },
  { label: "Site-wide", sections: ["contactPage", "navigation", "footer", "newsletter", "siteSeo", "theme"] },
] as const;

function collectTextFields(value: unknown, path: (string | number)[] = []): TextField[] {
  if (typeof value === "string") {
    const keyPath = path.map(String).join(".");
    if ([...DYNAMIC_CONTENT_PATHS].some((dynamicPath) => keyPath === dynamicPath || keyPath.startsWith(`${dynamicPath}.`))) return [];
    return [{ path, label: formatFieldLabel(path), value }];
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
  return SECTION_LABELS[value] ?? value
    .replace(/([A-Z])/g, " $1")
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());
}

function formatFieldLabel(path: (string | number)[]) {
  return path.slice(1).map((part) => typeof part === "number"
    ? `Item ${part + 1}`
    : FIELD_LABELS[part] ?? formatSectionLabel(part)).join(" / ") || formatSectionLabel(String(path[0] ?? "Content"));
}

function isLongCopyField(path: (string | number)[], value: string) {
  const last = String(path.at(-1) ?? "");
  return value.length > 120 || /(description|biography|paragraph|quote|summary|message|deliveryNote|address)$/i.test(last);
}

function isImageField(path: (string | number)[]) {
  return /(image|photo|logo|poster)$/i.test(String(path.at(-1) ?? ""));
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
  const editorSections: string[] = SECTION_GROUPS.flatMap((group) => group.sections.filter((section) => sections.includes(section)));
  if (!editorSections.includes("theme")) editorSections.push("theme");
  const allFields = collectTextFields(content);
  const visibleFields = allFields.filter((field) => {
    const inSection = search.trim() || field.path[0] === activeSection;
    const matchesSearch = !search.trim() || `${field.label} ${field.value}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    return inSection && matchesSearch;
  });
  const rectorSearchText = [
    content.home && typeof content.home === "object" ? JSON.stringify(content.home) : "",
    "provincial rector portrait quote message paragraphs",
  ].join(" ").toLocaleLowerCase();
  const showRectorEditor = (activeSection === "home" && !search.trim()) || (Boolean(search.trim()) && rectorSearchText.includes(search.trim().toLocaleLowerCase()));
  const founderSearchText = [
    content.founder && typeof content.founder === "object" ? JSON.stringify(content.founder) : "",
    "founder saint vincent pallotti biography",
  ].join(" ").toLocaleLowerCase();
  const showFounderEditor = (activeSection === "founder" && !search.trim()) || (Boolean(search.trim()) && founderSearchText.includes(search.trim().toLocaleLowerCase()));
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

  function updateRectorText(field: RectorTextField, value: string) {
    updateCopy(["home", field], value);
  }

  function updateRectorBody(value: string) {
    updateCopy(["home", "welcomeBody"], value);
  }

  function updateFounderBiography(value: string) {
    updateCopy(["founder", "biography"], value);
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
    <div className="site-content-editor flex min-w-0 w-full max-w-6xl flex-col gap-3">
      <Frame spacing="sm" className="sticky top-0 z-20 bg-background [--frame-radius:0px] [--frame-panel-radius:0px]">
        <FramePanel fit className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Site content</h2>
              <p className="text-xs text-muted-foreground">Edit page text, images, forms, navigation, and SEO.</p>
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
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search copy" className="w-full border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm" />
            </label>
          </div>
          <div className="xl:hidden">
            <label className="block text-xs font-medium text-muted-foreground">
              Choose a page
              <Select value={activeSection} onValueChange={(value) => {
                if (typeof value === "string") {
                  setActiveSection(value);
                  setSearch("");
                }
              }}>
                <SelectTrigger aria-label="Choose a site page" className="mt-1 w-full rounded-none text-base sm:text-sm">
                  <SelectValue placeholder="Choose a page" />
                </SelectTrigger>
                <SelectContent align="start" className="max-h-[65dvh] rounded-none">
                  {SECTION_GROUPS.map((group) => {
                    const availableSections = group.sections.filter((section) => editorSections.includes(section));
                    return availableSections.length > 0 ? <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {availableSections.map((section) => <SelectItem key={section} value={section}>{formatSectionLabel(section)}</SelectItem>)}
                    </SelectGroup> : null;
                  })}
                </SelectContent>
              </Select>
            </label>
          </div>
        </FramePanel>
      </Frame>

      {message && <p role="status" aria-live="polite" className="border border-border bg-card px-3 py-2 text-sm text-foreground">{message}</p>}
      {query.error && <p role="alert" className="border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-foreground">Could not load saved copy. The committed English and French text is open; saving creates its CMS record when the database is available.</p>}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Site content sections" className="hidden min-w-0 gap-3 xl:flex xl:flex-col xl:overflow-visible">
          {SECTION_GROUPS.map((group) => {
            const availableSections = group.sections.filter((section) => editorSections.includes(section));
            if (availableSections.length === 0) return null;
            return <div key={group.label} className="flex shrink-0 gap-1 xl:flex-col">
              <span className="hidden px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:block">{group.label}</span>
              {availableSections.map((section) => {
                const selected = !search && activeSection === section;
                return <button
                  key={section}
                  type="button"
                  onClick={() => { setActiveSection(section); setSearch(""); }}
                  aria-current={selected ? "location" : undefined}
                  className={`shrink-0 border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:w-full ${selected ? "border-border bg-muted text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
                >
                  {formatSectionLabel(section)}
                </button>;
              })}
            </div>;
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
                <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
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
            {!search && COLLECTION_SHORTCUTS[activeSection] && <Frame spacing="sm" className="[--frame-radius:0px] [--frame-panel-radius:0px]">
              <FramePanel fit className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{COLLECTION_SHORTCUTS[activeSection].description}</p>
                <Button type="button" size="sm" variant="outline" nativeButton={false} render={<Link href={COLLECTION_SHORTCUTS[activeSection].href} />}>
                  {COLLECTION_SHORTCUTS[activeSection].label}
                </Button>
              </FramePanel>
            </Frame>}
            {!search && <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">{formatSectionLabel(activeSection)}</h3>
              <p className="text-xs text-muted-foreground">{SECTION_DESCRIPTIONS[activeSection] ?? `Edit text and media used in the ${formatSectionLabel(activeSection).toLocaleLowerCase()}.`}</p>
            </div>}
            <p className="text-xs text-muted-foreground" role="status">
              {visibleFields.length} additional fields{search ? " match your search" : ` in ${formatSectionLabel(activeSection)}`}
            </p>

            {showRectorEditor && <Frame spacing="sm" stacked className="[--frame-radius:0px] [--frame-panel-radius:0px]">
              <FramePanel fit>
                <div className="mb-3 border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-foreground">Provincial Rector message</h3>
                  <p className="text-xs text-muted-foreground">Edit the portrait and all text shown in this homepage section.</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)]">
                  <div className="flex items-start gap-3 lg:flex-col">
                    <div className="relative h-32 w-24 shrink-0 border border-border bg-muted">
                      <Image src={draft[locale].home.rectorImage} alt={draft[locale].home.rectorName} fill sizes="96px" unoptimized className="object-cover object-top" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Portrait</span>
                      <CloudinaryMediaPicker label="Choose portrait" resourceType="image" onSelect={(asset) => updateRectorImage(asset.secureUrl || asset.url)} />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([
                        ["welcomeBadge", "Section label"],
                        ["welcomeTitle", "Heading"],
                        ["rectorName", "Rector name"],
                        ["rectorTitle", "Rector role"],
                      ] as const).map(([field, label]) => (
                        <label key={field} className="block min-w-0 text-xs font-medium text-muted-foreground">
                          {label}
                          <input value={draft[locale].home[field]} onChange={(event) => updateRectorText(field, event.target.value)} className="mt-1 w-full border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm" />
                        </label>
                      ))}
                    </div>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Quote
                      <textarea value={draft[locale].home.rectorQuote} rows={2} onChange={(event) => updateRectorText("rectorQuote", event.target.value)} className="mt-1 w-full resize-y border border-input bg-background px-3 py-2 text-base leading-relaxed text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm" />
                    </label>
                    <div className="border-t border-border pt-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-foreground">Message Body</h4>
                        <span className="text-[11px] text-muted-foreground">Rich text — formatting, links, and paragraphs supported</span>
                      </div>
                      <div className="border border-input bg-background">
                        <RichTextEditor
                          value={
                            Array.isArray(draft[locale].home.welcomeBody)
                              ? draft[locale].home.welcomeBody.join("\n\n")
                              : String(draft[locale].home.welcomeBody || "")
                          }
                          onChange={updateRectorBody}
                        />
                      </div>
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
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
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

            {showFounderEditor && <Frame spacing="sm" stacked className="[--frame-radius:0px] [--frame-panel-radius:0px]">
              <FramePanel fit>
                <div className="mb-3 border-b border-border pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Founder Biography</h3>
                      <p className="text-xs text-muted-foreground">Saint Vincent Pallotti biography shown on the Identity / Founder page.</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Rich text — formatting, links, and paragraphs supported</span>
                  </div>
                </div>
                <div className="border border-input bg-background">
                  <RichTextEditor
                    value={
                      Array.isArray(draft[locale].founder?.biography)
                        ? (draft[locale].founder.biography as string[]).join("\n\n")
                        : String(draft[locale].founder?.biography || "")
                    }
                    onChange={updateFounderBiography}
                  />
                </div>
              </FramePanel>
            </Frame>}

            {fieldGroups.size > 0 ? <Frame spacing="sm" stacked className="[--frame-radius:0px] [--frame-panel-radius:0px]">
              {[...fieldGroups.entries()].map(([group, fields]) => (
                <FramePanel key={group} fit>
                  <details open>
                    <summary className="cursor-pointer text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      {group === "pageCopy" ? "Page copy" : formatSectionLabel(group)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{fields.length}</span>
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {fields.map((field) => (
                        <label key={field.path.join(".")} className={`block min-w-0 border border-border bg-background p-2.5 ${isLongCopyField(field.path, field.value) || isImageField(field.path) ? "md:col-span-2" : ""}`}>
                          <span className="mb-1.5 block truncate text-xs font-medium text-muted-foreground">{formatFieldLabel(field.path)}</span>
                          {isImageField(field.path) ? (
                            <div className="flex flex-wrap items-center gap-3">
                              {field.value && <div className="relative h-24 w-36 shrink-0 border border-border bg-muted">
                                <Image src={field.value} alt={formatFieldLabel(field.path)} fill sizes="144px" unoptimized className="object-cover" />
                              </div>}
                              <CloudinaryMediaPicker label="Choose image" resourceType="image" onSelect={(asset) => updateCopy(field.path, asset.secureUrl || asset.url)} />
                            </div>
                          ) : isLongCopyField(field.path, field.value) ? (
                        <textarea value={field.value} rows={3} onChange={(event) => updateCopy(field.path, event.target.value)} className="w-full resize-y border border-input bg-background px-3 py-2 text-base leading-relaxed text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm" />
                          ) : (
                        <input value={field.value} onChange={(event) => updateCopy(field.path, event.target.value)} className="w-full border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm" />
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
