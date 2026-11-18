"use client";

import { useState, useEffect, useRef } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import PaginationControls from "@/components/ui/PaginationControls";

type Member = { name: string; role: string; image: string };

export default function DirectionEditor() {
  const [page, setPage] = useState(1);
  const [enMembers, setEnMembers] = useState<Member[]>([]);
  const [frMembers, setFrMembers] = useState<Member[]>([]);
  const [lang, setLang] = useState<"en"|"fr">("en");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);

  const members = lang === "en" ? enMembers : frMembers;
  const setMembers = lang === "en" ? setEnMembers : setFrMembers;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(members.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const offset = (activePage - 1) * pageSize;
  const visibleMembers = members.slice(offset, offset + pageSize);

  const query = useCmsCollection<{ en: Member[]; fr: Member[] }>("direction");
  const saveCollection = useSaveCmsCollection<{ en: Member[]; fr: Member[] }>("direction", () => serverRevision.current);
  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify({ en: enMembers, fr: frMembers });
    if (serverSnapshot.current === null) { setEnMembers(query.data.en); setFrMembers(query.data.fr); serverSnapshot.current = incoming; serverRevision.current = query.revision ?? null; }
    else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) { setEnMembers(query.data.en); setFrMembers(query.data.fr); serverSnapshot.current = incoming; }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, enMembers, frMembers]);

  function update(idx: number, field: keyof Member, value: string) {
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  async function save() {
    setSaving(true); setMsg("");
    const payload = { en: enMembers, fr: frMembers };
    const error = await saveCollection.mutateAsync(payload).then((saved) => { serverSnapshot.current = JSON.stringify(payload); serverRevision.current = saved.revision; return null; }).catch((reason) => reason instanceof Error ? reason.message : "Could not save direction.");
    setMsg(error ?? "Saved!");
    setSaving(false);
  }

  return (
    <div>
      {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading direction…</p>}
      {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(["en","fr"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="px-4 py-1.5  text-sm font-bold"
              style={{ background: lang === l ? "#5C3317" : "#e8e2d9", color: lang === l ? "#C9952A" : "#5C3317" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <button onClick={save} disabled={saving}
            className="px-4 py-2  text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {visibleMembers.map((m, pageIndex) => {
          const idx = offset + pageIndex;
          return (
          <div key={idx} className="bg-white  p-4 flex items-center gap-4 shadow-sm border border-gray-100">
            <span className="grid size-7 shrink-0 place-items-center bg-[#3e2009] text-[10px] font-bold tabular-nums text-white">{idx + 1}</span>
            <div className="w-16 h-16  overflow-hidden flex-shrink-0 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.image && <img src={m.image} alt={m.name} className="w-full h-full object-cover object-top" />}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Name</label>
                <input value={m.name} onChange={(e) => update(idx, "name", e.target.value)}
                  className="w-full text-sm font-bold border border-gray-200  px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C9952A]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Role</label>
                <input value={m.role} onChange={(e) => update(idx, "role", e.target.value)}
                  className="w-full text-sm border border-gray-200  px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C9952A]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Image path</label>
                <CloudinaryMediaPicker label="Pick image" resourceType="image" onSelect={(asset) => update(idx, "image", asset.secureUrl)} />
              </div>
            </div>
          </div>
        ); })}
      </div>
      <PaginationControls page={activePage} totalPages={totalPages} totalItems={members.length} pageSize={pageSize} itemLabel="members" lang={lang} onPageChange={setPage} />
    </div>
  );
}
