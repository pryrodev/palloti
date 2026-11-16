"use client";

import { useState, useEffect, useRef } from "react";

type Video = { src: string; poster: string; title: string };

export default function VideosEditor() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/videos", { credentials: "include" })
      .then((r) => r.json()).then(setVideos);
  }, []);

  async function uploadVideo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "video");
    const res = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: fd });
    const { url } = await res.json();
    setVideos((prev) => [...prev, { src: url, poster: "/images/gikondo.jpg", title: file.name.replace(/\.[^.]+$/, "") }]);
    setUploading(false);
  }

  function remove(idx: number) {
    if (!confirm("Remove this video?")) return;
    setVideos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/videos", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(videos),
    });
    setMsg(res.ok ? "✅ Saved!" : "❌ Error");
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{videos.length} video{videos.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <input ref={fileRef} type="file" accept="video/*" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadVideo(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#C9952A", color: "#3e2009" }}>
            {uploading ? "Uploading…" : "+ Upload Video"}
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {videos.map((v, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0 relative">
              {v.poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.poster} alt="" className="w-full h-full object-cover opacity-70" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <input value={v.title}
                onChange={(e) => setVideos((prev) => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))}
                className="w-full text-sm font-bold text-gray-800 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C9952A]" />
              <div className="flex gap-2">
                <input value={v.src} readOnly className="flex-1 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-1" />
                <input value={v.poster}
                  onChange={(e) => setVideos((prev) => prev.map((it, i) => i === idx ? { ...it, poster: e.target.value } : it))}
                  placeholder="Poster image URL"
                  className="flex-1 text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C9952A]" />
              </div>
            </div>
            <button onClick={() => remove(idx)}
              className="px-3 py-1 text-xs font-bold rounded bg-red-50 text-red-600 hover:bg-red-100 flex-shrink-0">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
