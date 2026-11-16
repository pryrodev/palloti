"use client";

import { useState, useEffect } from "react";

type Community = {
  id: string; name: string; location: string; region: string;
  description: string; works: string[]; image?: string;
};

const REGIONS = ["rwanda","drc","belgium","mission"];

export default function CommunitiesEditor() {
  const [enItems, setEnItems] = useState<Community[]>([]);
  const [frItems, setFrItems] = useState<Community[]>([]);
  const [lang, setLang] = useState<"en"|"fr">("en");
  const [editing, setEditing] = useState<Community | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const items = lang === "en" ? enItems : frItems;
  const setItems = lang === "en" ? setEnItems : setFrItems;

  useEffect(() => {
    fetch("/api/admin/communities", { credentials: "include" })
      .then((r) => r.json())
      .then(({ en, fr }) => { setEnItems(en); setFrItems(fr); });
  }, []);

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/communities", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ en: enItems, fr: frItems }),
    });
    setMsg(res.ok ? "✅ Saved!" : "❌ Error");
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(["en","fr"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ background: lang === l ? "#5C3317" : "#e8e2d9", color: lang === l ? "#C9952A" : "#5C3317" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Group by region */}
      {REGIONS.map((region) => {
        const regionItems = items.filter((c) => c.region === region);
        return (
          <div key={region} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black text-white uppercase tracking-wider"
                style={{ background: regionColors[region] }}>
                {region}
              </span>
              <span className="text-xs text-gray-400">{regionItems.length} communities</span>
            </div>
            <div className="space-y-2">
              {regionItems.map((c) => (
                <div key={c.id} className="bg-white rounded-xl p-4 flex items-start gap-4 shadow-sm border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.location}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                  </div>
                  <button onClick={() => setEditing(c)}
                    className="px-3 py-1 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200 flex-shrink-0">Edit</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-black text-lg mb-4">Edit Community</h2>
            {[
              { key: "name", label: "Name" },
              { key: "location", label: "Location" },
            ].map(({ key, label }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                <input value={(editing as unknown as Record<string,string>)[key]}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
              </div>
            ))}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Region</label>
              <select value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none">
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea value={editing.description} rows={3}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Works (one per line)</label>
              <textarea value={editing.works.join("\n")} rows={4}
                onChange={(e) => setEditing({ ...editing, works: e.target.value.split("\n").filter(Boolean) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={saveEditing}
                className="px-4 py-2 text-sm font-black rounded-lg text-white"
                style={{ background: "#5C3317" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
