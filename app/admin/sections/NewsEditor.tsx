"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Grid2X2, ImageOff, List } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Button } from "@/components/ui/button";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import { newsArticleSchema } from "@/lib/cmsSchemas";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import RichTextEditor from "./RichTextEditor";
import DataTable from "../components/DataTable";

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
    if (!newsArticleSchema.safeParse(editing).success) return;
    setArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === editing.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = editing; return copy; }
      return [{ ...editing, id: Date.now() }, ...prev];
    });
    setEditing(null);
  }

  async function publish() {
    setSaving(true); setMsg("");
    const payload = { en: enArticles, fr: frArticles };
    const error = await saveCollection.mutateAsync(payload).then((saved) => { serverSnapshot.current = JSON.stringify(payload); serverRevision.current = saved.revision; return null; }).catch((reason) => reason instanceof Error ? reason.message : "Failed to publish.");
    setMsg(error ?? "Published successfully!");
    setSaving(false);
  }

  const deleteArticle = useCallback((id: number) => {
    if (!confirm("Delete this article?")) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, [setArticles]);

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
        <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => setEditing(row.original)}>Edit</Button>
        <Button type="button" variant="destructive" size="sm" className="rounded-none" onClick={() => deleteArticle(row.original.id)}>Delete</Button>
      </div>,
    },
  ], [deleteArticle]);

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
              className="px-4 py-1.5  text-sm font-bold transition-all"
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
            className="px-4 py-2  text-sm font-black"
            style={{ background: "#C9952A", color: "#3e2009" }}>
            + New Article
          </button>
          <button onClick={publish} disabled={saving}
            className="px-4 py-2  text-sm font-black disabled:opacity-50"
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
              <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => setEditing(a)}>Edit</Button>
              <Button type="button" variant="destructive" size="sm" className="rounded-none" onClick={() => deleteArticle(a.id)}>Delete</Button>
            </div>
          </article>
        ))}
      </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white  p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-black text-lg mb-4 text-gray-800">
              {editing.id === EMPTY.id ? "New Article" : "Edit Article"}
            </h2>
            {[
              { key: "title",    label: "Title",     type: "text" },
              { key: "slug", label: "URL slug", type: "text", placeholder: "leave blank to generate from title" },
              { key: "seoTitle", label: "SEO title", type: "text", placeholder: "Optional, up to 70 characters" },
              { key: "seoDescription", label: "SEO description", type: "text", placeholder: "Optional, up to 160 characters" },
              { key: "date",     label: "Date",      type: "text", placeholder: "DD/MM/YYYY" },
              { key: "tags",     label: "Tags",      type: "text", placeholder: "Tag1 | Tag2" },
              { key: "imageUrl", label: "Image URL", type: "text", placeholder: "/images/p5.jpg" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                <input type={type} placeholder={placeholder}
                  value={(editing as unknown as Record<string, string>)[key] ?? ""}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  className="w-full px-3 py-2  border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
              </div>
            ))}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Summary</label>
              <textarea value={editing.summary} rows={3}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
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
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-bold  bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={saveEditing} disabled={!validation?.success}
                className="px-4 py-2 text-sm font-black  text-white"
                style={{ background: "#5C3317", opacity: validation?.success ? 1 : 0.5 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
