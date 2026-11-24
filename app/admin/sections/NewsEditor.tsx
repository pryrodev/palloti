"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ExternalLink, Grid2X2, ImageOff, List } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Button } from "@/components/ui/button";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import { newsArticleSchema } from "@/lib/cmsSchemas";
import { createSeoMetadata } from "@/lib/seoMetadata";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import RichTextEditor from "./RichTextEditor";
import DataTable from "../components/DataTable";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";

type Article = {
  id: number;
  slug?: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  date: string;
  tags: string;
  summary: string;
  content?: string;
  imageUrl: string;
  images?: string[];
};

function toDateInputValue(displayDate?: string): string {
  if (!displayDate) return "";
  const trimmed = displayDate.trim();
  const dmy = trimmed.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const dt = new Date(parsed);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

function fromDateInputValue(inputValue: string): string {
  if (!inputValue) return "";
  const ymd = inputValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${d}/${m}/${y}`;
  }
  return inputValue;
}

function getTodayDmy(): string {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
}

const createEmptyArticle = (): Article => ({
  id: Date.now(),
  slug: "",
  title: "",
  seoTitle: "",
  seoDescription: "",
  date: getTodayDmy(),
  tags: "",
  summary: "",
  content: "",
  imageUrl: "",
  images: [],
});

const EMPTY_ID = -1;

export default function NewsEditor() {
  const [enArticles, setEnArticles] = useState<Article[]>([]);
  const [frArticles, setFrArticles] = useState<Article[]>([]);
  const [itArticles, setItArticles] = useState<Article[]>([]);
  const [lang, setLang] = useState<"en" | "fr" | "it">("en");
  const [editing, setEditing] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");

  const articles = lang === "en" ? enArticles : lang === "fr" ? frArticles : itArticles;
  const setArticles = lang === "en" ? setEnArticles : lang === "fr" ? setFrArticles : setItArticles;

  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);
  const deleteLock = useRef(false);
  const query = useCmsCollection<{ en: Article[]; fr: Article[]; it?: Article[] }>("news");
  const saveCollection = useSaveCmsCollection<{ en: Article[]; fr: Article[]; it?: Article[] }>("news", () => serverRevision.current);
  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify({ en: enArticles, fr: frArticles, it: itArticles });
    if (serverSnapshot.current === null) {
      setEnArticles(query.data.en ?? []);
      setFrArticles(query.data.fr ?? []);
      setItArticles(query.data.it ?? query.data.en ?? []);
      serverSnapshot.current = incoming;
      serverRevision.current = query.revision ?? null;
    } else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) {
        setEnArticles(query.data.en ?? []);
        setFrArticles(query.data.fr ?? []);
        setItArticles(query.data.it ?? query.data.en ?? []);
        serverSnapshot.current = incoming;
      }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, enArticles, frArticles, itArticles]);

  function saveEditing() {
    if (!editing) return;
    const generated = createSeoMetadata(editing.title, editing.summary);
    const articleToSave = {
      ...editing,
      slug: editing.slug?.trim() || generated.slug,
      seoTitle: editing.seoTitle?.trim() || generated.seoTitle,
      seoDescription: editing.seoDescription?.trim() || generated.seoDescription,
    };
    if (!newsArticleSchema.safeParse(articleToSave).success) return;
    setArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === articleToSave.id);
      if (articleToSave.id > 0 && idx >= 0) {
        const copy = [...prev];
        copy[idx] = articleToSave;
        return copy;
      }
      return [{ ...articleToSave, id: Date.now() }, ...prev];
    });
    setEditing(null);
  }

  function updateEditingTitle(title: string) {
    setEditing((current) => {
      if (!current) return current;
      const previousGenerated = createSeoMetadata(current.title, current.summary);
      const nextGenerated = createSeoMetadata(title, current.summary);
      return {
        ...current,
        title,
        slug: !current.slug || current.slug === previousGenerated.slug ? nextGenerated.slug : current.slug,
        seoTitle: !current.seoTitle || current.seoTitle === previousGenerated.seoTitle ? nextGenerated.seoTitle : current.seoTitle,
      };
    });
  }

  function updateEditingSummary(summary: string) {
    setEditing((current) => {
      if (!current) return current;
      const previousGenerated = createSeoMetadata(current.title, current.summary);
      const nextGenerated = createSeoMetadata(current.title, summary);
      return {
        ...current,
        summary,
        seoDescription: !current.seoDescription || current.seoDescription === previousGenerated.seoDescription
          ? nextGenerated.seoDescription
          : current.seoDescription,
      };
    });
  }

  const editArticle = useCallback((article: Article) => {
    const generated = createSeoMetadata(article.title, article.summary);
    setEditing({
      ...article,
      slug: article.slug?.trim() || generated.slug,
      seoTitle: article.seoTitle?.trim() || generated.seoTitle,
      seoDescription: article.seoDescription?.trim() || generated.seoDescription,
    });
  }, []);

  async function publish() {
    setSaving(true); setMsg("");
    const payload = { en: enArticles, fr: frArticles, it: itArticles };
    const error = await saveCollection.mutateAsync(payload).then((saved) => { serverSnapshot.current = JSON.stringify(payload); serverRevision.current = saved.revision; return null; }).catch((reason) => reason instanceof Error ? reason.message : "Failed to publish.");
    setMsg(error ?? "Published successfully!");
    setSaving(false);
  }

  const deleteArticle = useCallback(async (id: number) => {
    if (deleteLock.current) return false;
    deleteLock.current = true;
    setSaving(true);
    setMsg("");
    const payload = {
      en: lang === "en" ? enArticles.filter((article) => article.id !== id) : enArticles,
      fr: lang === "fr" ? frArticles.filter((article) => article.id !== id) : frArticles,
      it: lang === "it" ? itArticles.filter((article) => article.id !== id) : itArticles,
    };
    try {
      const saved = await saveCollection.mutateAsync(payload);
      setEnArticles(payload.en);
      setFrArticles(payload.fr);
      setItArticles(payload.it ?? []);
      serverSnapshot.current = JSON.stringify(payload);
      serverRevision.current = saved.revision;
      setMsg("Article deleted.");
      return true;
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Could not delete this article.");
      return false;
    } finally {
      deleteLock.current = false;
      setSaving(false);
    }
  }, [lang, enArticles, frArticles, itArticles, saveCollection]);

  const columns = useMemo<ColumnDef<DataGridFeatures, Article>[]>(() => [
    {
      id: "index",
      header: "#",
      enableSorting: false,
      size: 48,
      minSize: 48,
      maxSize: 48,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.index + 1}</span>,
    },
    {
      id: "image",
      header: "Image",
      enableSorting: false,
      size: 96,
      minSize: 96,
      maxSize: 96,
      cell: ({ row }) => row.original.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.original.imageUrl} alt="" className="h-12 w-16 border border-[#eadfd2] object-cover" />
      ) : (
        <div className="grid h-12 w-16 place-items-center border border-[#eadfd2] bg-[#fbf7f1] text-[#9e711a]" aria-label="No article image">
          <ImageOff aria-hidden="true" className="size-4" />
        </div>
      ),
    },
    {
      accessorKey: "title",
      size: 280,
      minSize: 240,
      header: ({ column }) => <DataGridColumnHeader title="Title" column={column} />,
      cell: ({ row }) => <p className="break-words text-xs leading-4 font-semibold text-[#3e2009]">{row.original.title || "(no title)"}</p>,
    },
    {
      accessorKey: "summary",
      size: 360,
      minSize: 300,
      header: ({ column }) => <DataGridColumnHeader title="Summary" column={column} />,
      cell: ({ row }) => <p className="line-clamp-3 break-words whitespace-normal text-xs leading-4 text-muted-foreground">{row.original.summary || "—"}</p>,
    },
    {
      accessorKey: "date",
      size: 120,
      minSize: 120,
      maxSize: 120,
      header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.date || "—"}</span>,
    },
    {
      accessorKey: "tags",
      size: 180,
      minSize: 150,
      header: ({ column }) => <DataGridColumnHeader title="Tags" column={column} />,
      cell: ({ row }) => <span className="line-clamp-2 max-w-48 text-xs text-muted-foreground">{row.original.tags || "—"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      size: 160,
      minSize: 160,
      maxSize: 160,
      cell: ({ row }) => <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button type="button" variant="outline" size="sm" onClick={() => editArticle(row.original)}>Edit</Button>
        <ConfirmDeleteAction
          title="Are you sure?"
          description={`You are about to delete the article “${row.original.title}”. This action cannot be undone.`}
          disabled={saving}
          onConfirm={() => deleteArticle(row.original.id)}
        >Delete</ConfirmDeleteAction>
      </div>,
    },
  ], [deleteArticle, editArticle, saving]);

  const validation = editing ? newsArticleSchema.safeParse(editing) : null;

  return (
    <div>
      {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading news…</p>}
      {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
      {/* Lang toggle + actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["en", "fr", "it"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="cursor-pointer px-4 py-1.5 text-sm font-bold transition-all duration-150 ease-out hover:opacity-90 active:scale-95"
              style={{ background: lang === l ? "#5C3317" : "#e8e2d9", color: lang === l ? "#C9952A" : "#5C3317" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex border border-[#dfcdb6] bg-white p-0.5" aria-label="Article view layout">
            <Button type="button" variant={view === "table" ? "secondary" : "ghost"} size="icon-sm" className="rounded-none" aria-label="Table view" aria-pressed={view === "table"} onClick={() => setView("table")}>
              <List aria-hidden="true" />
            </Button>
            <Button type="button" variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" className="rounded-none" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
              <Grid2X2 aria-hidden="true" />
            </Button>
          </div>
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <button onClick={() => setEditing(createEmptyArticle())}
            className="cursor-pointer px-4 py-2 text-sm font-black shadow-xs transition-all duration-150 ease-out hover:brightness-105 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            style={{ background: "#C9952A", color: "#3e2009" }}>
            + New Article
          </button>
          <button onClick={publish} disabled={saving}
            className="cursor-pointer px-4 py-2 text-sm font-black shadow-xs transition-all duration-150 ease-out hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Article collection: reusable table or visual card grid. */}
      {view === "table" ? (
        <DataTable
          columns={columns}
          data={articles}
          getRowId={(article) => String(article.id)}
          onRowClick={editArticle}
          isLoading={query.isLoading}
          emptyMessage="No articles in this language yet. Create an article to get started."
          pageSize={10}
        />
      ) : articles.length === 0 ? (
        <div className="border border-[#eadfd2] bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No articles in this language yet. Create an article to get started.
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {articles.map((a) => (
          <article
            key={a.id}
            onClick={() => editArticle(a)}
            className="group cursor-pointer overflow-hidden border border-[#eadfd2] bg-white transition-all duration-150 hover:border-[#C9952A] hover:shadow-md"
          >
            {a.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" className="h-40 w-full border-b border-[#eadfd2] object-cover" />
            )}
            {!a.imageUrl && (
              <div className="grid h-40 place-items-center border-b border-[#eadfd2] bg-[#fbf7f1] text-[#9e711a]">
                <div className="flex items-center gap-2 text-xs"><ImageOff aria-hidden="true" className="size-4" /> No article image</div>
              </div>
            )}
            <div className="min-w-0 space-y-2 p-4">
              <p className="line-clamp-2 text-sm font-semibold text-[#3e2009]">{a.title || "(no title)"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.date} · {a.tags}</p>
              <p className="text-xs leading-5 text-gray-500 line-clamp-3">{a.summary}</p>
            </div>
            <div className="flex gap-2 border-t border-[#eadfd2] px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <Button type="button" variant="outline" size="sm" onClick={() => editArticle(a)}>Edit</Button>
              <ConfirmDeleteAction
                title="Are you sure?"
                description={`You are about to delete the article “${a.title}”. This action cannot be undone.`}
                disabled={saving}
                onConfirm={() => deleteArticle(a.id)}
              >Delete</ConfirmDeleteAction>
            </div>
          </article>
        ))}
      </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
          <div className="max-h-[94dvh] w-full max-w-7xl overflow-y-auto overscroll-contain bg-white p-4 shadow-2xl sm:p-6 lg:p-8">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="font-black text-lg text-gray-800">
                  {editing.id <= 0 ? "New Article" : "Edit Article"}
                </h2>
                <p className="text-xs text-gray-400">Click any row in the table to open and edit this article.</p>
              </div>
              {editing.id > 0 && (
                <a
                  href={`/${lang}/news/${editing.slug || editing.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#5C3317] hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  View on site
                </a>
              )}
            </div>

            {/* Title */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title</label>
              <input
                type="text"
                placeholder="Article title"
                value={editing.title}
                onChange={(e) => updateEditingTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
              />
            </div>

            {/* Publication Date */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Publication Date
              </label>
              <input
                type="date"
                value={toDateInputValue(editing.date)}
                onChange={(e) => setEditing({ ...editing, date: fromDateInputValue(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
              />
              {editing.date && (
                <span className="mt-1 block text-[11px] text-gray-400">
                  Display date: <span className="font-semibold text-gray-600">{editing.date}</span>
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tags</label>
              <input
                type="text"
                placeholder="e.g. Newsletter | Generalate | Holy Family Province"
                value={editing.tags}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Summary</label>
              <textarea value={editing.summary} rows={3}
                onChange={(e) => updateEditingSummary(e.target.value)}
                className="w-full px-3 py-2  border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Article body</label>
              <RichTextEditor value={editing.content ?? ""} onChange={(content) => setEditing({ ...editing, content })} />
              <p className="mt-1 text-xs text-gray-400">Use the toolbar to format text or insert photos. If left blank, the article will show the summary.</p>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Article Photos</span>
                <CloudinaryMediaPicker
                  label="+ Add photo"
                  resourceType="image"
                  onSelect={(asset) => {
                    const currentImages = Array.isArray(editing.images) ? editing.images : (editing.imageUrl ? [editing.imageUrl] : []);
                    const newUrl = asset.secureUrl;
                    if (!currentImages.includes(newUrl)) {
                      const nextImages = [...currentImages, newUrl];
                      setEditing({
                        ...editing,
                        imageUrl: editing.imageUrl || newUrl,
                        images: nextImages,
                      });
                    }
                  }}
                />
              </div>

              {(() => {
                const imageList = Array.isArray(editing.images) && editing.images.length > 0
                  ? editing.images
                  : (editing.imageUrl ? [editing.imageUrl] : []);

                if (imageList.length === 0) {
                  return (
                    <div className="border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">
                      No article photos selected yet. Click "+ Add photo" to choose one or more images.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {imageList.map((url, i) => {
                      const isCover = url === editing.imageUrl;
                      return (
                        <div key={`${url}-${i}`} className={`relative rounded border p-1 text-left ${isCover ? "border-[#C9952A] bg-amber-50/50 ring-1 ring-[#C9952A]" : "border-gray-200 bg-white"}`}>
                          <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-1">
                            {isCover ? (
                              <span className="rounded bg-[#C9952A] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">Cover</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditing({ ...editing, imageUrl: url })}
                                className="text-[10px] text-amber-800 hover:underline font-semibold"
                              >
                                Set cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const nextImages = imageList.filter((item) => item !== url);
                                const nextCover = editing.imageUrl === url ? (nextImages[0] || "") : editing.imageUrl;
                                setEditing({
                                  ...editing,
                                  imageUrl: nextCover,
                                  images: nextImages,
                                });
                              }}
                              title="Remove image"
                              className="text-[10px] text-red-600 hover:text-red-800 font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            {validation && !validation.success && <p role="alert" className="mb-3 text-xs text-red-700">{validation.error.issues[0]?.message}</p>}
            <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
              <button onClick={() => setEditing(null)}
                className="cursor-pointer px-4 py-2 text-sm font-bold bg-gray-100 text-gray-700 shadow-xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9952A]">Cancel</button>
              <button onClick={saveEditing} disabled={!validation?.success}
                className="cursor-pointer px-4 py-2 text-sm font-black text-white shadow-xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9952A] disabled:pointer-events-none"
                style={{ background: "#5C3317", opacity: validation?.success ? 1 : 0.5 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
