"use client";

import { useEffect, useRef, useState } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import PaginationControls from "@/components/ui/PaginationControls";

type Video = { src: string; poster: string; title: string };

export default function VideosEditor() {
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);
  const query = useCmsCollection<Video[]>("videos");
  const saveCollection = useSaveCmsCollection<Video[]>("videos", () => serverRevision.current);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(videos.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const offset = (activePage - 1) * pageSize;
  const visibleVideos = videos.slice(offset, offset + pageSize);

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify(videos);
    if (serverSnapshot.current === null) { setVideos(query.data); serverSnapshot.current = incoming; serverRevision.current = query.revision ?? null; }
    else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) { setVideos(query.data); serverSnapshot.current = incoming; }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, videos]);

  async function save() {
    setSaving(true); setMessage("");
    try { const saved = await saveCollection.mutateAsync(videos); serverSnapshot.current = JSON.stringify(videos); serverRevision.current = saved.revision; setMessage("Saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save videos."); }
    finally { setSaving(false); }
  }

  return <div>
    <div className="mb-6 flex items-center justify-between gap-3">
      <p className="text-sm text-gray-500">{videos.length} videos</p>
      <div className="flex items-center gap-3">
        {message && <span role="status" className="text-sm font-bold">{message}</span>}
        <CloudinaryMediaPicker label="+ Add Video" resourceType="video" onSelect={(asset) => {
          if (asset.resourceType !== "video") { setMessage("Choose a video asset."); return; }
          setVideos((previous) => [...previous, { src: asset.secureUrl, poster: "/images/gikondo.jpg", title: asset.publicId.split("/").pop() ?? "Video" }]);
        }} />
        <button onClick={save} disabled={saving} className=" bg-[#5C3317] px-4 py-2 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
    {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading videos…</p>}
    {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
    <div className="space-y-4">{visibleVideos.map((video, pageIndex) => {
      const index = offset + pageIndex;
      return <div key={`${video.src}-${index}`} className="relative flex items-center gap-4 border border-gray-100 bg-white p-4 shadow-sm">
      <span className="absolute left-1 top-1 grid size-5 place-items-center bg-[#3e2009] text-[9px] font-bold tabular-nums text-white">{index + 1}</span>
      <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden  bg-gray-900"><img src={video.poster} alt="" className="h-full w-full object-cover opacity-70" /><span className="absolute inset-0 grid place-items-center text-2xl text-white">▶</span></div>
      <div className="min-w-0 flex-1 space-y-2">
        <input aria-label="Video title" value={video.title} onChange={(event) => setVideos((previous) => previous.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} className="w-full  border border-gray-200 px-2 py-1 text-sm font-bold" />
        <div className="flex flex-wrap gap-2"><input aria-label="Video URL" value={video.src} readOnly className="min-w-0 flex-1  border border-gray-100 bg-gray-50 px-2 py-1 text-xs text-gray-400" />
          <CloudinaryMediaPicker label="Choose poster" resourceType="image" onSelect={(asset) => setVideos((previous) => previous.map((item, i) => i === index ? { ...item, poster: asset.secureUrl } : item))} /></div>
      </div>
      <button onClick={() => setVideos((previous) => previous.filter((_, i) => i !== index))} className=" bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Remove</button>
    </div>;
    })}</div>
    <PaginationControls page={activePage} totalPages={totalPages} totalItems={videos.length} pageSize={pageSize} itemLabel="videos" lang="en" onPageChange={setPage} />
  </div>;
}
