"use client";

import { useState, useEffect, useRef } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import PaginationControls from "@/components/ui/PaginationControls";

type Community = {
  id: string; name: string; location: string; region: string;
  description: string; works: string[]; image?: string;
};

const REGIONS = ["rwanda","drc","belgium","mission"];

export default function CommunitiesEditor() {
  const [page, setPage] = useState(1);
  const [enItems, setEnItems] = useState<Community[]>([]);
  const [frItems, setFrItems] = useState<Community[]>([]);
  const [lang, setLang] = useState<"en"|"fr">("en");
  const [editing, setEditing] = useState<Community | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);

  const items = lang === "en" ? enItems : frItems;
  const setItems = lang === "en" ? setEnItems : setFrItems;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const offset = (activePage - 1) * pageSize;
  const visibleItems = items.slice(offset, offset + pageSize);

  const query = useCmsCollection<{ en: Community[]; fr: Community[] }>("communities");
  const saveCollection = useSaveCmsCollection<{ en: Community[]; fr: Community[] }>("communities", () => serverRevision.current);
  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify({ en: enItems, fr: frItems });
    if (serverSnapshot.current === null) { setEnItems(query.data.en); setFrItems(query.data.fr); serverSnapshot.current = incoming; serverRevision.current = query.revision ?? null; }
    else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) { setEnItems(query.data.en); setFrItems(query.data.fr); serverSnapshot.current = incoming; }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, enItems, frItems]);

  async function save() {
    setSaving(true); setMsg("");
    const payload = { en: enItems, fr: frItems };
    const error = await saveCollection.mutateAsync(payload).then((saved) => { serverSnapshot.current = JSON.stringify(payload); serverRevision.current = saved.revision; return null; }).catch((reason) => reason instanceof Error ? reason.message : "Could not save communities.");
    setMsg(error ?? "Saved!");
    setSaving(false);
  }

  function saveEditing() {
    if (!editing) return;
    setItems((prev) => {
      const idx = prev.findIndex((c) => c.id === editing.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = editing; return copy; }
      return [...prev, editing];
    });
    setEditing(null);
  }

  const regionColors: Record<string, string> = {
    rwanda: "#2C4A1E", drc: "#1A3A5C", belgium: "#4A2060", mission: "#5C3317",
  };

  return (
    <div>
      {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading communities…</p>}
      {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["en","fr"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="px-4 py-1.5  text-sm font-bold"
              style={{ background: lang === l ? "#5C3317" : "#e8e2d9", color: lang === l ? "#C9952A" : "#5C3317" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          {msg && <span role="status" className="text-sm font-bold">{msg}</span>}
          <button onClick={save} disabled={saving}
            className="px-4 py-2  text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Group by region */}
      {REGIONS.map((region) => {
        const regionItems = visibleItems.filter((c) => c.region === region);
        return (
          <div key={region} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1  text-xs font-black text-white uppercase tracking-wider"
                style={{ background: regionColors[region] }}>
                {region}
              </span>
              <span className="text-xs text-gray-400">{regionItems.length} communities</span>
            </div>
            <div className="space-y-2">
              {regionItems.map((c) => (
                <div key={c.id} className="bg-white  p-4 flex items-start gap-4 shadow-sm border border-gray-100">
                  <span className="grid size-7 shrink-0 place-items-center bg-[#3e2009] text-[10px] font-bold tabular-nums text-white">{items.findIndex((item) => item.id === c.id) + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.location}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                  </div>
                  <button onClick={() => setEditing(c)}
                    className="px-3 py-1 text-xs font-bold  bg-gray-100 hover:bg-gray-200 flex-shrink-0">Edit</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <PaginationControls page={activePage} totalPages={totalPages} totalItems={items.length} pageSize={pageSize} itemLabel="communities" lang={lang} onPageChange={setPage} />

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain bg-white p-4 shadow-2xl sm:p-6">
            <h2 className="font-black text-lg mb-4">Edit Community</h2>
            {[
              { key: "name", label: "Name" },
              { key: "location", label: "Location" },
            ].map(({ key, label }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                <input value={(editing as unknown as Record<string,string>)[key]}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  className="w-full px-3 py-2  border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
              </div>
            ))}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Region</label>
              <select value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value })}
                className="w-full px-3 py-2  border border-gray-200 text-sm focus:outline-none">
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea value={editing.description} rows={3}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2  border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Works (one per line)</label>
              <textarea value={editing.works.join("\n")} rows={4}
                onChange={(e) => setEditing({ ...editing, works: e.target.value.split("\n").filter(Boolean) })}
                className="w-full px-3 py-2  border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
            </div>
            <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-bold  bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={saveEditing}
                className="px-4 py-2 text-sm font-black  text-white"
                style={{ background: "#5C3317" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
