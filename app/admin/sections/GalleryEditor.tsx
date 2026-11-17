"use client";

import { useEffect, useRef, useState } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";

type GalleryItem = { src: string; title: string; sub: string };

export default function GalleryEditor() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const serverSnapshot = useRef<string | null>(null);
  const query = useCmsCollection<GalleryItem[]>("gallery");
  const saveCollection = useSaveCmsCollection<GalleryItem[]>("gallery");

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify(items);
    if (serverSnapshot.current === null) { setItems(query.data); serverSnapshot.current = incoming; }
    else if (draft === serverSnapshot.current && incoming !== serverSnapshot.current) { setItems(query.data); serverSnapshot.current = incoming; }
  }, [query.data, items]);

  async function save() {
    setSaving(true); setMessage("");
    try { await saveCollection.mutateAsync(items); serverSnapshot.current = JSON.stringify(items); setMessage("Saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save gallery."); }
    finally { setSaving(false); }
  }

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-500">{items.length} photos</p>
      <div className="flex items-center gap-3">
        {message && <span role="status" className="text-sm font-bold">{message}</span>}
        <CloudinaryMediaPicker label="+ Add Photos" resourceType="image" onSelect={(asset) => setItems((previous) => [...previous, { src: asset.secureUrl, title: asset.publicId.split("/").pop() ?? "Photo", sub: "Holy Family Province" }])} />
        <button onClick={save} disabled={saving} className="rounded-lg bg-[#5C3317] px-4 py-2 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
    {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading gallery…</p>}
    {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item, index) => <div key={`${item.src}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <img src={item.src} alt={item.title} className="aspect-square w-full object-cover" />
        <div className="p-2"><input aria-label="Photo title" value={item.title} onChange={(event) => setItems((previous) => previous.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry))} className="w-full truncate border-none bg-transparent text-xs font-bold text-gray-700 outline-none" />
          <input aria-label="Photo subtitle" value={item.sub} onChange={(event) => setItems((previous) => previous.map((entry, i) => i === index ? { ...entry, sub: event.target.value } : entry))} className="w-full border-none bg-transparent text-[10px] text-gray-400 outline-none" /></div>
        <button type="button" aria-label="Remove photo" onClick={() => setItems((previous) => previous.filter((_, i) => i !== index))} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100">×</button>
      </div>)}
    </div>
  </div>;
}
