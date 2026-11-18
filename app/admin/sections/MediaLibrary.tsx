"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CloudinaryMediaPicker, { type MediaAsset } from "./CloudinaryMediaPicker";
import { cmsQueryKeys } from "@/lib/useCmsCollection";
import PaginationControls from "@/components/ui/PaginationControls";

type MediaPage = {
  items: MediaAsset[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; offset: number };
};

const PAGE_SIZE = 24;

export default function MediaLibrary() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const query = useQuery<MediaPage>({
    queryKey: cmsQueryKeys.mediaPage(page, PAGE_SIZE),
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/admin/media?page=${page}&pageSize=${PAGE_SIZE}`, {
        credentials: "include",
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Could not load media. Check the database connection.");
      return response.json();
    },
    refetchInterval: 15_000,
  });
  const { items = [], pagination } = query.data ?? { items: [], pagination: { page, pageSize: PAGE_SIZE, total: 0, totalPages: 0, offset: 0 } };

  return <section>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-xl font-black text-[#3e2009]">Media Library</h2><p className="text-sm text-gray-500">Images, videos, and documents available to the CMS.</p></div>
      <CloudinaryMediaPicker label="Upload or select media" onSelect={() => client.invalidateQueries({ queryKey: cmsQueryKeys.media })} />
    </div>
    {query.isLoading && <p className="text-sm text-gray-500">Loading media…</p>}
    {query.error && <p role="alert" className="text-sm text-red-700">{query.error.message}</p>}
    {!query.isLoading && !query.error && pagination.total === 0 && <div className="border border-dashed border-[#d8cbbb] bg-white p-10 text-center text-sm text-gray-500">No Cloudinary assets have been added yet.</div>}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((asset, index) => <article key={asset.id ?? asset.publicId} className="relative overflow-hidden border border-gray-100 bg-white shadow-sm">
        <span className="absolute left-2 top-2 z-10 grid size-6 place-items-center border border-white/70 bg-[#3e2009]/85 text-[10px] font-bold tabular-nums text-white">{pagination.offset + index + 1}</span>
        {asset.resourceType === "image" ? <img src={asset.secureUrl} alt={asset.publicId} className="aspect-square w-full object-cover" /> :
          <div className="flex aspect-square items-center justify-center bg-[#f8f4ef] text-4xl">{asset.resourceType === "video" ? "▶" : "▤"}</div>}
        <div className="p-3"><p className="truncate text-xs font-bold text-gray-800" title={asset.publicId}>{asset.publicId}</p><p className="mt-1 text-[10px] uppercase text-gray-400">{asset.provider ?? "cloudinary"} · {asset.resourceType}{asset.format ? ` · ${asset.format}` : ""}</p>
          <a href={asset.secureUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-[#8b5b1e] underline">Open asset</a></div>
      </article>)}
    </div>
    {!query.isLoading && !query.error && <PaginationControls
      page={page}
      totalPages={pagination.totalPages}
      totalItems={pagination.total}
      pageSize={PAGE_SIZE}
      itemLabel="media items"
      lang="en"
      onPageChange={setPage}
    />}
  </section>;
}
