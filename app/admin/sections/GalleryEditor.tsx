"use client";

import { useState } from "react";
import Image from "next/image";
import PaginationControls from "@/components/ui/PaginationControls";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import { Trash2 } from "lucide-react";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";
import { useGalleryMutations, useGalleryPage, type GalleryItem } from "@/lib/adminQueries";

const PAGE_SIZE = 24;

export default function GalleryEditor() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [prevQueryData, setPrevQueryData] = useState<GalleryItem[] | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const query = useGalleryPage(page, PAGE_SIZE);
  const mutations = useGalleryMutations(page, PAGE_SIZE);

  const pagination = query.data?.pagination ?? { page, pageSize: PAGE_SIZE, total: items.length, totalPages: 1, offset: 0 };

  if (query.data?.data && query.data.data !== prevQueryData) {
    setPrevQueryData(query.data.data);
    setItems(query.data.data);
  }

  // Save current page changes
  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const revision = query.data?.revision;
      if (revision === undefined) throw new Error("Wait for the current gallery revision before saving.");
      await mutations.save.mutateAsync({ items, expectedRevision: revision });
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save gallery.");
    } finally {
      setSaving(false);
    }
  }

  // Delete a single photo
  async function deletePhoto(pageIndex: number, item: GalleryItem) {
    setSaving(true);
    setMessage("");
    try {
      const globalIndex = pagination.offset + pageIndex;
      const revision = query.data?.revision;
      if (revision === undefined) throw new Error("Wait for the current gallery revision before deleting.");
      await mutations.remove.mutateAsync({ index: globalIndex, src: item.src, expectedRevision: revision });
      setMessage("Photo deleted.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete this photo.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Add new photos
  async function addPhotos(asset: { secureUrl: string; publicId: string }) {
    setSaving(true);
    setMessage("");
    try {
      const newPhoto: GalleryItem = {
        src: asset.secureUrl,
        title: asset.publicId.split("/").pop() ?? "Photo",
        sub: "Holy Family Province",
      };
      await mutations.add.mutateAsync(newPhoto);
      setMessage("Photo added.");
      setPage(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add photo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {pagination.total} photos {pagination.totalPages > 1 && `(Page ${page} of ${pagination.totalPages})`}
        </p>
        <div className="flex items-center gap-3">
          {message && <span role="status" className="text-sm font-bold text-[#5C3317]">{message}</span>}
          <CloudinaryMediaPicker label="+ Add Photos" resourceType="image" onSelect={addPhotos} />
          <button onClick={save} disabled={saving || !query.data?.revision} className="bg-[#5C3317] px-4 py-2 text-sm font-black text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading gallery…</p>}
      {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item, pageIndex) => {
          const globalNumber = pagination.offset + pageIndex + 1;
          return (
            <div key={`${item.src}-${pageIndex}`} className="group relative overflow-hidden border border-gray-100 bg-white shadow-sm">
              <span className="absolute left-2 top-2 z-10 grid size-6 place-items-center border border-white/70 bg-[#3e2009]/85 text-[10px] font-bold tabular-nums text-white">
                {globalNumber}
              </span>
              <div className="relative aspect-square w-full">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  loading={pageIndex === 0 ? "eager" : "lazy"}
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <input
                  aria-label="Photo title"
                  value={item.title}
                  onChange={(event) =>
                    setItems((prev) => prev.map((entry, i) => (i === pageIndex ? { ...entry, title: event.target.value } : entry)))
                  }
                  className="w-full truncate border-none bg-transparent text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#C9952A]"
                />
                <input
                  aria-label="Photo subtitle"
                  value={item.sub}
                  onChange={(event) =>
                    setItems((prev) => prev.map((entry, i) => (i === pageIndex ? { ...entry, sub: event.target.value } : entry)))
                  }
                  className="w-full border-none bg-transparent text-[10px] text-gray-400 outline-none focus:ring-1 focus:ring-[#C9952A]"
                />
              </div>
              <ConfirmDeleteAction
                title="Are you sure?"
                description={`You are about to delete the photo “${item.title || `Photo ${globalNumber}`}”. This action cannot be undone.`}
                confirmLabel="Delete"
                triggerAriaLabel={`Remove photo ${item.title || globalNumber}`}
                triggerSize="icon-sm"
                disabled={saving}
                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                onConfirm={() => deletePhoto(pageIndex, item)}
              >
                <Trash2 aria-hidden="true" />
              </ConfirmDeleteAction>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <PaginationControls
          page={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={PAGE_SIZE}
          itemLabel="photos"
          lang="en"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
