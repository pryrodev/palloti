"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { FileText, Images, Play, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cmsQueryKeys } from "@/lib/useCmsCollection";
import PaginationControls from "@/components/ui/PaginationControls";
import CloudinaryMediaPicker, { type MediaAsset } from "./CloudinaryMediaPicker";

type MediaPage = {
  items: MediaAsset[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; offset: number };
};

const PAGE_SIZE = 24;
const MEDIA_FILTERS = [
  { value: "all", label: "All files" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "raw", label: "Documents" },
] as const;

export default function MediaLibrary() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [resourceType, setResourceType] = useState<(typeof MEDIA_FILTERS)[number]["value"]>("all");
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState("");

  const query = useQuery<MediaPage>({
    queryKey: cmsQueryKeys.mediaPage(page, PAGE_SIZE, resourceType),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (resourceType !== "all") params.set("resourceType", resourceType);
      const response = await fetch(`/api/admin/media?${params}`, {
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

  async function runBackfill() {
    setBackfilling(true);
    setBackfillMsg("");
    try {
      const res = await fetch("/api/admin/media/backfill-names", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json() as { updated?: number; total?: number; failed?: number; message?: string; error?: string };
      if (!res.ok) {
        setBackfillMsg(`Error: ${data.error ?? "Unknown error"}`);
      } else if (data.message) {
        setBackfillMsg(data.message);
      } else {
        setBackfillMsg(`Done — updated ${data.updated ?? 0} of ${data.total ?? 0} assets${data.failed ? `, ${data.failed} failed` : ""}.`);
        await client.invalidateQueries({ queryKey: cmsQueryKeys.media });
      }
    } catch {
      setBackfillMsg("Network error — try again.");
    } finally {
      setBackfilling(false);
    }
  }

  return <section>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black text-[#3e2009]">Media Library</h2>
        <p className="text-sm text-gray-500">Images, videos, and documents available to the CMS.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {backfillMsg && <span className="text-xs text-gray-600">{backfillMsg}</span>}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={backfilling}
          onClick={runBackfill}
          title="Fetch readable filenames from Cloudinary for all documents that still show a hash ID"
        >
          <Wand2 data-icon="inline-start" />
          {backfilling ? "Fixing names…" : "Fix document names"}
        </Button>
        <CloudinaryMediaPicker label="Upload or select media" onSelect={() => client.invalidateQueries({ queryKey: cmsQueryKeys.media })} />
      </div>
    </div>

    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter media by file type">
      {MEDIA_FILTERS.map((filter) => <Button
        key={filter.value}
        type="button"
        size="sm"
        variant={resourceType === filter.value ? "default" : "outline"}
        aria-pressed={resourceType === filter.value}
        onClick={() => { setResourceType(filter.value); setPage(1); }}
      >
        {filter.label}
      </Button>)}
    </div>

    {query.isLoading && <p className="text-sm text-gray-500">Loading media…</p>}
    {query.error && <p role="alert" className="text-sm text-red-700">{query.error.message}</p>}
    {!query.isLoading && !query.error && pagination.total === 0 && <div className="border border-dashed border-[#d8cbbb] bg-white p-10 text-center text-sm text-gray-500">No media in this file type yet.</div>}

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((asset, index) => {
        const displayName = asset.name?.trim() || asset.publicId?.split("/").pop() || "";
        return <a key={asset.id ?? asset.publicId} href={asset.secureUrl} target="_blank" rel="noreferrer" aria-label={`Open ${displayName}`} title={displayName} className="relative block overflow-hidden border border-gray-100 bg-white shadow-sm transition-colors hover:border-[#C9952A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9952A]">
          <span className="absolute left-2 top-2 z-10 grid size-6 place-items-center border border-white/70 bg-[#3e2009]/85 text-[10px] font-bold tabular-nums text-white">{pagination.offset + index + 1}</span>
          {asset.resourceType === "image" ? <div className="relative aspect-square w-full"><Image src={asset.secureUrl} alt="Media image" fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw" className="object-cover" /></div> :
            <div className="flex aspect-square items-center justify-center bg-[#f8f4ef] text-[#5C3317]">
              {asset.resourceType === "video" ? <Play aria-hidden="true" className="size-8" /> : <FileText aria-hidden="true" className="size-8" />}
            </div>}
          <div className="border-t border-gray-100 px-2 py-1.5">
            <p className="truncate text-xs font-semibold text-[#3e2009]">{displayName}</p>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                {asset.resourceType === "image" ? <Images aria-hidden="true" className="size-3.5" /> : asset.resourceType === "video" ? <Play aria-hidden="true" className="size-3.5" /> : <FileText aria-hidden="true" className="size-3.5" />}
                {asset.resourceType === "raw" ? "Document" : asset.resourceType === "image" ? "Image" : "Video"}
              </span>
              <span className="text-xs font-medium text-[#5C3317] underline underline-offset-2">Open</span>
            </div>
          </div>
        </a>;
      })}
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
