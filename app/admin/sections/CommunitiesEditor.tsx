"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ImageOff, Plus, Trash2 } from "lucide-react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import PaginationControls from "@/components/ui/PaginationControls";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";

type Community = {
  id: string;
  name: string;
  location: string;
  region: string;
  description: string;
  works: string[];
  image?: string;
};

const REGIONS = ["rwanda", "drc", "belgium", "mission"] as const;

function createEmptyCommunity(): Community {
  return {
    id: `community-${Date.now()}`,
    name: "",
    location: "",
    region: "rwanda",
    description: "",
    works: [],
    image: "",
  };
}

export default function CommunitiesEditor() {
  const [page, setPage] = useState(1);
  const [enItems, setEnItems] = useState<Community[]>([]);
  const [frItems, setFrItems] = useState<Community[]>([]);
  const [itItems, setItItems] = useState<Community[]>([]);
  const [lang, setLang] = useState<"en" | "fr" | "it">("en");
  const [editing, setEditing] = useState<Community | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);

  const items = lang === "en" ? enItems : lang === "fr" ? frItems : itItems;
  const setItems = lang === "en" ? setEnItems : lang === "fr" ? setFrItems : setItItems;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const offset = (activePage - 1) * pageSize;
  const visibleItems = items.slice(offset, offset + pageSize);

  const query = useCmsCollection<{ en: Community[]; fr: Community[]; it?: Community[] }>("communities");
  const saveCollection = useSaveCmsCollection<{ en: Community[]; fr: Community[]; it?: Community[] }>("communities", () => serverRevision.current);

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify({ en: enItems, fr: frItems, it: itItems });
    if (serverSnapshot.current === null) {
      setEnItems(query.data.en ?? []);
      setFrItems(query.data.fr ?? []);
      setItItems(query.data.it ?? query.data.en ?? []);
      serverSnapshot.current = incoming;
      serverRevision.current = query.revision ?? null;
    } else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) {
        setEnItems(query.data.en ?? []);
        setFrItems(query.data.fr ?? []);
        setItItems(query.data.it ?? query.data.en ?? []);
        serverSnapshot.current = incoming;
      }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, enItems, frItems, itItems]);

  async function save() {
    setSaving(true);
    setMsg("");
    const payload = { en: enItems, fr: frItems, it: itItems };
    const error = await saveCollection
      .mutateAsync(payload)
      .then((saved) => {
        serverSnapshot.current = JSON.stringify(payload);
        serverRevision.current = saved.revision;
        return null;
      })
      .catch((reason) => (reason instanceof Error ? reason.message : "Could not save communities."));
    setMsg(error ?? "Saved!");
    setSaving(false);
  }

  function saveEditing() {
    if (!editing || !editing.name.trim()) return;
    setItems((prev) => {
      const idx = prev.findIndex((c) => c.id === editing.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = editing;
        return copy;
      }
      return [...prev, editing];
    });
    setEditing(null);
  }

  function deleteCommunity(id: string) {
    setItems((prev) => prev.filter((c) => c.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  const regionColors: Record<string, string> = {
    rwanda: "#2C4A1E",
    drc: "#1A3A5C",
    belgium: "#4A2060",
    mission: "#5C3317",
  };

  return (
    <div>
      {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading communities…</p>}
      {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["en", "fr", "it"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className="px-4 py-1.5 text-sm font-bold transition-all duration-150 hover:-translate-y-0.5"
              style={{ background: lang === l ? "#5C3317" : "#e8e2d9", color: lang === l ? "#C9952A" : "#5C3317" }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          {msg && <span role="status" className="text-sm font-bold text-amber-900">{msg}</span>}

          <button
            type="button"
            onClick={() => setEditing(createEmptyCommunity())}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#C9952A] text-white hover:bg-[#b08020] transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Plus className="size-4" />
            New Community
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2 text-sm font-black text-white disabled:opacity-50 transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
            style={{ background: "#5C3317" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Group by region */}
      {REGIONS.map((region) => {
        const regionItems = visibleItems.filter((c) => c.region === region);
        return (
          <div key={region} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="px-3 py-1 text-xs font-black text-white uppercase tracking-wider"
                style={{ background: regionColors[region] }}
              >
                {region}
              </span>
              <span className="text-xs text-gray-400">{regionItems.length} communities</span>
            </div>

            <div className="space-y-3">
              {regionItems.map((c) => (
                <div key={c.id} className="bg-white p-4 flex items-start gap-4 shadow-xs border border-gray-100 hover:border-[#C9952A] transition-colors">
                  <span className="grid size-7 shrink-0 place-items-center bg-[#3e2009] text-[10px] font-bold tabular-nums text-white">
                    {items.findIndex((item) => item.id === c.id) + 1}
                  </span>

                  <div className="relative size-16 shrink-0 overflow-hidden border border-gray-200 bg-gray-50">
                    {c.image ? (
                      <Image src={c.image} alt={c.name} fill unoptimized sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.location}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
                    >
                      Edit
                    </button>
                    <ConfirmDeleteAction
                      title="Delete community?"
                      description={`Are you sure you want to delete “${c.name}”? This change will apply once you click Save Changes.`}
                      confirmLabel="Delete"
                      onConfirm={() => deleteCommunity(c.id)}
                    >
                      Delete
                    </ConfirmDeleteAction>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <PaginationControls
        page={activePage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={pageSize}
        itemLabel="communities"
        lang={lang}
        onPageChange={setPage}
      />

      {/* Edit / Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain bg-white p-4 shadow-2xl sm:p-6">
            <h2 className="font-black text-lg mb-4 text-gray-800">
              {items.some((c) => c.id === editing.id) ? "Edit Community" : "New Community"}
            </h2>

            {[
              { key: "name", label: "Name" },
              { key: "location", label: "Location" },
            ].map(({ key, label }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                <input
                  value={(editing as unknown as Record<string, string>)[key] ?? ""}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
                />
              </div>
            ))}

            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Region</label>
              <select
                value={editing.region}
                onChange={(e) => setEditing({ ...editing, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea
                value={editing.description}
                rows={3}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Works / Ministries (one per line)</label>
              <textarea
                value={editing.works.join("\n")}
                rows={3}
                onChange={(e) => setEditing({ ...editing, works: e.target.value.split("\n").filter(Boolean) })}
                className="w-full px-3 py-2 border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
              />
            </div>

            {/* Community Image */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Community Photo</label>
              <div className="flex items-center gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden border border-gray-200 bg-gray-50">
                  {editing.image ? (
                    <Image src={editing.image} alt="Community" fill unoptimized sizes="64px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CloudinaryMediaPicker
                    label={editing.image ? "Change photo" : "Choose photo"}
                    resourceType="image"
                    onSelect={(asset) => setEditing({ ...editing, image: asset.secureUrl })}
                  />
                  {editing.image && (
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, image: "" })}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-bold bg-gray-100 hover:bg-gray-200 transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditing}
                disabled={!editing.name.trim()}
                className="px-5 py-2 text-sm font-black text-white disabled:opacity-50 transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
                style={{ background: "#5C3317" }}
              >
                Save Community
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
