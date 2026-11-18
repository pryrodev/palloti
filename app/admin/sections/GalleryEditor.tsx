"use client";

import { useEffect, useRef, useState } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import PaginationControls from "@/components/ui/PaginationControls";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";

type GalleryItem = { src: string; title: string; sub: string };

export default function GalleryEditor() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);
  const query = useCmsCollection<GalleryItem[]>("gallery");
  const saveCollection = useSaveCmsCollection<GalleryItem[]>("gallery", () => serverRevision.current);
  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const offset = (activePage - 1) * pageSize;
  const visibleItems = items.slice(offset, offset + pageSize);

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify(items);
    if (serverSnapshot.current === null) { setItems(query.data); serverSnapshot.current = incoming; serverRevision.current = query.revision ?? null; }
    else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) { setItems(query.data); serverSnapshot.current = incoming; }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, items]);

  async function save() {
    setSaving(true); setMessage("");
    try { const saved = await saveCollection.mutateAsync(items); serverSnapshot.current = JSON.stringify(items); serverRevision.current = saved.revision; setMessage("Saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save gallery."); }
    finally { setSaving(false); }
  }

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-500">{items.length} photos</p>
      <div className="flex items-center gap-3">
        {message && <span role="status" className="text-sm font-bold">{message}</span>}
        <CloudinaryMediaPicker label="+ Add Photos" resourceType="image" onSelect={(asset) => setItems((previous) => [...previous, { src: asset.secureUrl, title: asset.publicId.split("/").pop() ?? "Photo", sub: "Holy Family Province" }])} />
        <button onClick={save} disabled={saving} className=" bg-[#5C3317] px-4 py-2 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
    {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading gallery…</p>}
    {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {visibleItems.map((item, pageIndex) => {
        const index = offset + pageIndex;
        return <div key={`${item.src}-${index}`} className="group relative overflow-hidden border border-gray-100 bg-white shadow-sm">
        <span className="absolute left-2 top-2 z-10 grid size-6 place-items-center border border-white/70 bg-[#3e2009]/85 text-[10px] font-bold tabular-nums text-white">{index + 1}</span>
        <img src={item.src} alt={item.title} className="aspect-square w-full object-cover" />
        <div className="p-2"><input aria-label="Photo title" value={item.title} onChange={(event) => setItems((previous) => previous.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry))} className="w-full truncate border-none bg-transparent text-xs font-bold text-gray-700 outline-none" />
          <input aria-label="Photo subtitle" value={item.sub} onChange={(event) => setItems((previous) => previous.map((entry, i) => i === index ? { ...entry, sub: event.target.value } : entry))} className="w-full border-none bg-transparent text-[10px] text-gray-400 outline-none" /></div>
        <button type="button" aria-label="Remove photo" onClick={() => setItems((previous) => previous.filter((_, i) => i !== index))} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center  bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100">×</button>
      </div>;
      })}
    </div>
    <PaginationControls page={activePage} totalPages={totalPages} totalItems={items.length} pageSize={pageSize} itemLabel="photos" lang="en" onPageChange={setPage} />
  </div>;
}
