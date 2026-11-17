"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import CloudinaryMediaPicker, { type MediaAsset } from "./CloudinaryMediaPicker";
import { cmsQueryKeys } from "@/lib/useCmsCollection";

export default function MediaLibrary() {
  const client = useQueryClient();
  const { data = [], isLoading, error } = useQuery<MediaAsset[]>({
    queryKey: cmsQueryKeys.media,
    queryFn: async () => {
      const response = await fetch("/api/admin/media", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Could not load media. Check the database connection.");
      return response.json();
    },
    refetchInterval: 15_000,
  });

  return <section>
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div><h2 className="text-xl font-black text-[#3e2009]">Media Library</h2><p className="text-sm text-gray-500">Images, videos, and documents available to the CMS.</p></div>
      <CloudinaryMediaPicker label="Upload or select media" onSelect={() => client.invalidateQueries({ queryKey: cmsQueryKeys.media })} />
    </div>
    {isLoading && <p className="text-sm text-gray-500">Loading media…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error.message}</p>}
    {!isLoading && !error && data.length === 0 && <div className="rounded-xl border border-dashed border-[#d8cbbb] bg-white p-10 text-center text-sm text-gray-500">No Cloudinary assets have been added yet.</div>}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {data.map((asset) => <article key={asset.publicId} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {asset.resourceType === "image" ? <img src={asset.secureUrl} alt={asset.publicId} className="aspect-square w-full object-cover" /> :
          <div className="flex aspect-square items-center justify-center bg-[#f8f4ef] text-4xl">{asset.resourceType === "video" ? "▶" : "▤"}</div>}
        <div className="p-3"><p className="truncate text-xs font-bold text-gray-800" title={asset.publicId}>{asset.publicId}</p><p className="mt-1 text-[10px] uppercase text-gray-400">{asset.provider ?? "cloudinary"} · {asset.resourceType}{asset.format ? ` · ${asset.format}` : ""}</p>
          <a href={asset.secureUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-[#8b5b1e] underline">Open asset</a></div>
      </article>)}
    </div>
  </section>;
}
