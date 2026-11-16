"use client";

import { useState, useEffect, useRef } from "react";

type GalleryItem = { src: string; title: string; sub: string };

export default function GalleryEditor() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/gallery", { credentials: "include" })
      .then((r) => r.json()).then(setItems);
  }, []);

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "image");
    const res = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: fd });
    const { url } = await res.json();
    setItems((prev) => [...prev, { src: url, title: file.name.replace(/\.[^.]+$/, ""), sub: "Holy Family Province" }]);
    setUploading(false);
  }

  function remove(idx: number) {
    if (!confirm("Remove this image?")) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/gallery", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    setMsg(res.ok ? "✅ Saved!" : "❌ Error");
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{items.length} photos</p>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={async (e) => { for (const f of Array.from(e.target.files ?? [])) await uploadImage(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#C9952A", color: "#3e2009" }}>
            {uploading ? "Uploading…" : "+ Upload Photos"}
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.title} className="w-full aspect-square object-cover" />
            <div className="p-2">
              <input value={item.title}
                onChange={(e) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))}
                className="w-full text-xs font-bold text-gray-700 border-none outline-none bg-transparent truncate" />
              <input value={item.sub}
                onChange={(e) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, sub: e.target.value } : it))}
                className="w-full text-[10px] text-gray-400 border-none outline-none bg-transparent" />
            </div>
            <button onClick={() => remove(idx)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
