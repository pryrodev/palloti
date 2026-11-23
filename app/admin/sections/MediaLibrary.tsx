"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Check, FileText, Images, Pencil, Play, Wand2, X } from "lucide-react";
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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [savingRename, setSavingRename] = useState(false);

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
      const data = await res.json() as {
        updated?: number;
        total?: number;
        failed?: number;
        message?: string;
        error?: string;
        errors?: string[];
      };

      if (!res.ok) {
        setBackfillMsg(`⚠️ ${data.error ?? "Failed to connect to media service."}`);
      } else if (data.message) {
        setBackfillMsg(`ℹ️ ${data.message}`);
      } else if ((data.updated ?? 0) > 0) {
        setBackfillMsg(`✅ Successfully updated ${data.updated} file name${(data.updated ?? 0) > 1 ? "s" : ""}.`);
        await client.invalidateQueries({ queryKey: cmsQueryKeys.media });
      } else {
        setBackfillMsg("⚠️ Cloudinary original names were not found for these files. You can rename them directly below.");
      }
    } catch {
      setBackfillMsg("⚠️ Network error — please try again.");
    } finally {
      setBackfilling(false);
    }
  }

  async function saveRename(assetId: string) {
    if (!renameValue.trim()) return;
    setSavingRename(true);
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: assetId, name: renameValue.trim() }),
      });
      if (!res.ok) throw new Error("Could not rename");
      await client.invalidateQueries({ queryKey: cmsQueryKeys.media });
      setRenamingId(null);
    } catch {
      alert("Could not update the file name. Please try again.");
    } finally {
      setSavingRename(false);
    }
  }

  function startRename(asset: MediaAsset) {
    const currentName = asset.name?.trim() || asset.publicId?.split("/").pop() || "";
    setRenamingId(asset.id ?? asset.publicId);
    setRenameValue(currentName);
  }

  return <section>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black text-[#3e2009]">Media Library</h2>
        <p className="text-sm text-gray-500">Images, videos, and documents available to the CMS.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {backfillMsg && (
          <span className="max-w-md rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 border border-amber-200">
            {backfillMsg}
          </span>
        )}
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
        const isEditingThis = renamingId === (asset.id ?? asset.publicId);

        return <div
          key={asset.id ?? asset.publicId}
          className="relative block overflow-hidden border border-gray-100 bg-white shadow-xs transition-all hover:border-[#C9952A] hover:shadow-sm"
        >
          <span className="absolute left-2 top-2 z-10 grid size-6 place-items-center border border-white/70 bg-[#3e2009]/85 text-[10px] font-bold tabular-nums text-white">
            {pagination.offset + index + 1}
          </span>

          <a href={asset.secureUrl} target="_blank" rel="noreferrer" aria-label={`Open ${displayName}`} className="block">
            {asset.resourceType === "image" ? (
              <div className="relative aspect-square w-full">
                <Image src={asset.secureUrl} alt="Media image" fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw" className="object-cover" />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-[#f8f4ef] text-[#5C3317]">
                {asset.resourceType === "video" ? <Play aria-hidden="true" className="size-8" /> : <FileText aria-hidden="true" className="size-8" />}
              </div>
            )}
          </a>

          <div className="border-t border-gray-100 p-2">
            {isEditingThis ? (
              <div className="flex items-center gap-1 mb-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); if (asset.id) saveRename(asset.id); }
                    if (e.key === "Escape") { e.preventDefault(); setRenamingId(null); }
                  }}
                  autoFocus
                  className="w-full text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:border-[#C9952A] focus:outline-hidden"
                  placeholder="File name"
                />
                <button
                  type="button"
                  disabled={savingRename}
                  onClick={() => asset.id && saveRename(asset.id)}
                  title="Save"
                  className="rounded p-1 text-green-700 hover:bg-green-50"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingId(null)}
                  title="Cancel"
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <p className="truncate text-xs font-semibold text-[#3e2009]" title={displayName}>
                {displayName}
              </p>
            )}

            <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-gray-50">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                {asset.resourceType === "image" ? <Images aria-hidden="true" className="size-3" /> : asset.resourceType === "video" ? <Play aria-hidden="true" className="size-3" /> : <FileText aria-hidden="true" className="size-3" />}
                {asset.resourceType === "raw" ? "Doc" : asset.resourceType === "image" ? "Image" : "Video"}
              </span>

              <div className="flex items-center gap-2">
                {asset.id && !isEditingThis && (
                  <button
                    type="button"
                    onClick={() => startRename(asset)}
                    className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-800 hover:text-amber-950 hover:underline"
                    title="Rename this file"
                  >
                    <Pencil className="size-2.5" />
                    Rename
                  </button>
                )}
                <a
                  href={asset.secureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-[#5C3317] underline underline-offset-2"
                >
                  Open
                </a>
              </div>
            </div>
          </div>
        </div>;
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
