"use client";

import { useState, useEffect, useRef } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import { newsArticleSchema } from "@/lib/cmsSchemas";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";

type Article = {
  id: number;
  title: string;
  date: string;
  tags: string;
  summary: string;
  imageUrl: string;
};

const EMPTY: Article = { id: Date.now(), title: "", date: "", tags: "", summary: "", imageUrl: "" };

export default function NewsEditor() {
  const [enArticles, setEnArticles] = useState<Article[]>([]);
  const [frArticles, setFrArticles] = useState<Article[]>([]);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [editing, setEditing] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const articles = lang === "en" ? enArticles : frArticles;
  const setArticles = lang === "en" ? setEnArticles : setFrArticles;

  const serverSnapshot = useRef<string | null>(null);
  const query = useCmsCollection<{ en: Article[]; fr: Article[] }>("news");
  const saveCollection = useSaveCmsCollection<{ en: Article[]; fr: Article[] }>("news");
  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify({ en: enArticles, fr: frArticles });
    if (serverSnapshot.current === null) { setEnArticles(query.data.en); setFrArticles(query.data.fr); serverSnapshot.current = incoming; }
    else if (draft === serverSnapshot.current && incoming !== serverSnapshot.current) { setEnArticles(query.data.en); setFrArticles(query.data.fr); serverSnapshot.current = incoming; }
  }, [query.data, enArticles, frArticles]);

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
    const res = await saveCollection.mutateAsync(payload).then(() => { serverSnapshot.current = JSON.stringify(payload); return { ok: true }; }).catch(() => ({ ok: false }));
    setMsg(res.ok ? "✅ Published successfully!" : "❌ Failed to publish");
    setSaving(false);
  }

  function deleteArticle(id: number) {
    if (!confirm("Delete this article?")) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  const validation = editing ? newsArticleSchema.safeParse(editing) : null;

  return (
    <div>
      {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading news…</p>}
      {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
      {/* Lang toggle + actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(["en", "fr"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
              style={{ background: lang === l ? "#5C3317" : "#e8e2d9", color: lang === l ? "#C9952A" : "#5C3317" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <button onClick={() => setEditing({ ...EMPTY })}
            className="px-4 py-2 rounded-lg text-sm font-black"
            style={{ background: "#C9952A", color: "#3e2009" }}>
            + New Article
          </button>
          <button onClick={publish} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Article list */}
      <div className="space-y-3">
        {articles.map((a) => (
          <div key={a.id} className="bg-white rounded-xl p-4 flex items-start gap-4 shadow-sm border border-gray-100">
            {a.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-800 truncate">{a.title || "(no title)"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.date} · {a.tags}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.summary}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditing(a)}
                className="px-3 py-1 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200">Edit</button>
              <button onClick={() => deleteArticle(a.id)}
                className="px-3 py-1 text-xs font-bold rounded bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  value={(editing as unknown as Record<string, string>)[key]}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
              </div>
            ))}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Summary</label>
              <textarea value={editing.summary} rows={3}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
            </div>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500">Article image</span>
              <CloudinaryMediaPicker label="Choose image" resourceType="image" onSelect={(asset) => setEditing({ ...editing, imageUrl: asset.secureUrl })} />
            </div>
            {validation && !validation.success && <p role="alert" className="mb-3 text-xs text-red-700">{validation.error.issues[0]?.message}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={saveEditing} disabled={!validation?.success}
                className="px-4 py-2 text-sm font-black rounded-lg text-white"
                style={{ background: "#5C3317", opacity: validation?.success ? 1 : 0.5 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
