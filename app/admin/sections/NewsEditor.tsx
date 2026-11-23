"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Grid2X2, ImageOff, List } from "lucide-react";
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
};

const EMPTY: Article = { id: Date.now(), slug: "", title: "", seoTitle: "", seoDescription: "", date: "", tags: "", summary: "", content: "", imageUrl: "" };

export default function NewsEditor() {
  const [enArticles, setEnArticles] = useState<Article[]>([]);
  const [frArticles, setFrArticles] = useState<Article[]>([]);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [editing, setEditing] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");

  const articles = lang === "en" ? enArticles : frArticles;
  const setArticles = lang === "en" ? setEnArticles : setFrArticles;

  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);
  const deleteLock = useRef(false);
  const query = useCmsCollection<{ en: Article[]; fr: Article[] }>("news");
  const saveCollection = useSaveCmsCollection<{ en: Article[]; fr: Article[] }>("news", () => serverRevision.current);
  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify({ en: enArticles, fr: frArticles });
    if (serverSnapshot.current === null) { setEnArticles(query.data.en); setFrArticles(query.data.fr); serverSnapshot.current = incoming; serverRevision.current = query.revision ?? null; }
    else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) { setEnArticles(query.data.en); setFrArticles(query.data.fr); serverSnapshot.current = incoming; }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, enArticles, frArticles]);

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
      if (idx >= 0) { const copy = [...prev]; copy[idx] = articleToSave; return copy; }
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
    const payload = { en: enArticles, fr: frArticles };
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
    };
    try {
      const saved = await saveCollection.mutateAsync(payload);
      setEnArticles(payload.en);
      setFrArticles(payload.fr);
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
  }, [lang, enArticles, frArticles, saveCollection]);

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
      cell: ({ row }) => <div className="flex gap-2">
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
          {(["en", "fr"] as const).map((l) => (
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
          <button onClick={() => setEditing({ ...EMPTY })}
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
          <article key={a.id} className="overflow-hidden border border-[#eadfd2] bg-white">
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
            <div className="flex gap-2 border-t border-[#eadfd2] px-4 py-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain bg-white p-4 shadow-2xl sm:p-6">
            <h2 className="font-black text-lg mb-4 text-gray-800">
              {editing.id === EMPTY.id ? "New Article" : "Edit Article"}
            </h2>
            {[
              { key: "title",    label: "Title",     type: "text" },
              { key: "date",     label: "Date",      type: "text", placeholder: "DD/MM/YYYY" },
              { key: "tags",     label: "Tags",      type: "text", placeholder: "Tag1 | Tag2" },
              { key: "imageUrl", label: "Image URL", type: "text", placeholder: "/images/p5.jpg" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                <input type={type} placeholder={placeholder}
                  value={(editing as unknown as Record<string, string>)[key] ?? ""}
                  onChange={(e) => {
                    if (key === "title") updateEditingTitle(e.target.value);
                    else if (key === "summary") updateEditingSummary(e.target.value);
                    else setEditing({ ...editing, [key]: e.target.value });
                  }}
                  className="w-full px-3 py-2  border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
              </div>
            ))}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Summary</label>
              <textarea value={editing.summary} rows={3}
                onChange={(e) => updateEditingSummary(e.target.value)}
                className="w-full px-3 py-2  border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Article body</label>
              <RichTextEditor value={editing.content ?? ""} onChange={(content) => setEditing({ ...editing, content })} />
              <p className="mt-1 text-xs text-gray-400">Use the toolbar to format the article. If left blank, the article page will show the summary.</p>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500">Article image</span>
              <CloudinaryMediaPicker label="Choose image" resourceType="image" onSelect={(asset) => setEditing({ ...editing, imageUrl: asset.secureUrl })} />
            </div>
            {validation && !validation.success && <p role="alert" className="mb-3 text-xs text-red-700">{validation.error.issues[0]?.message}</p>}
            <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
              <button onClick={() => setEditing(null)}
                className="cursor-pointer px-4 py-2 text-sm font-bold bg-gray-100 text-gray-700 transition-all duration-150 ease-out hover:bg-gray-200 active:scale-95">Cancel</button>
              <button onClick={saveEditing} disabled={!validation?.success}
                className="cursor-pointer px-4 py-2 text-sm font-black text-white shadow-xs transition-all duration-150 ease-out hover:brightness-110 hover:shadow-md active:scale-95 disabled:pointer-events-none"
                style={{ background: "#5C3317", opacity: validation?.success ? 1 : 0.5 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
