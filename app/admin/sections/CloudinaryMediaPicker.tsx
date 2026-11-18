"use client";

import Script from "next/script";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cmsQueryKeys } from "@/lib/useCmsCollection";
import PaginationControls from "@/components/ui/PaginationControls";

export type MediaAsset = {
  id?: string;
  publicId: string;
  url: string;
  secureUrl: string;
  provider?: "cloudinary" | "local";
  resourceType: "image" | "video" | "raw";
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: { event?: string; info?: Record<string, unknown> }) => void,
      ) => { open: () => void };
    };
  }
}

export default function CloudinaryMediaPicker({ onSelect, label = "Choose from media", resourceType }: { onSelect: (asset: MediaAsset) => void; label?: string; resourceType?: MediaAsset["resourceType"] }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [error, setError] = useState("");
  const mediaPageSize = 20;
  const mediaQuery = useQuery<{ items: MediaAsset[]; pagination: { page: number; pageSize: number; total: number; totalPages: number; offset: number } }>({
    queryKey: cmsQueryKeys.mediaPage(mediaPage, mediaPageSize, resourceType),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(mediaPage), pageSize: String(mediaPageSize) });
      if (resourceType) params.set("resourceType", resourceType);
      const response = await fetch(`/api/admin/media?${params}`, { credentials: "include", cache: "no-store", signal });
      if (!response.ok) throw new Error("Could not load the media library.");
      return response.json();
    },
    enabled: open,
    refetchInterval: false,
  });
  const assets = mediaQuery.data?.items ?? [];

  async function saveAsset(info: Record<string, unknown>) {
    const asset: MediaAsset = {
      publicId: String(info.public_id ?? ""),
      url: String(info.url ?? info.secure_url ?? ""),
      secureUrl: String(info.secure_url ?? info.url ?? ""),
      resourceType: String(info.resource_type) === "video" ? "video" : String(info.resource_type) === "raw" ? "raw" : "image",
      format: typeof info.format === "string" ? info.format : undefined,
      bytes: typeof info.bytes === "number" ? info.bytes : undefined,
      width: typeof info.width === "number" ? info.width : undefined,
      height: typeof info.height === "number" ? info.height : undefined,
    };
    const response = await fetch("/api/admin/media", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(asset),
    });
    if (!response.ok) throw new Error("The asset could not be added to the media library.");
    await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.media });
    onSelect(asset);
  }

  function uploadToCloudinary() {
    setError("");
    if (!window.cloudinary || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY) {
      setError("Set the Cloudinary environment values to upload media.");
      return;
    }
    const widget = window.cloudinary.createUploadWidget({
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      uploadSignature: async (callback: (signature: string) => void, params: Record<string, string | number>) => {
        const response = await fetch("/api/admin/cloudinary-signature", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not sign upload");
        callback(result.signature);
      },
      resourceType: resourceType ?? "auto",
      sources: ["local", "url"],
      multiple: false,
      folder: "pallotti-cms",
      clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "pdf", "doc", "docx"],
      maxFileSize: 100_000_000,
      showAdvancedOptions: false,
    }, async (widgetError, result) => {
      if (widgetError) { setError("Cloudinary could not open the upload widget."); return; }
      if (result.event !== "success" || !result.info) return;
      try { await saveAsset(result.info); }
      catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Could not save this upload."); }
    });
    widget.open();
  }

  function choose(asset: MediaAsset) {
    onSelect(asset);
    setOpen(false);
  }

  return <>
    <Script src="https://upload-widget.cloudinary.com/latest/global/all.js" onLoad={() => setReady(true)} />
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={() => { setError(""); setMediaPage(1); setOpen(true); }} className=" bg-[#f2e9da] px-3 py-2 text-xs font-bold text-[#5C3317]">{label}</button>
      <button type="button" onClick={uploadToCloudinary} disabled={!ready} className=" border border-[#e1d4c3] bg-white px-3 py-2 text-xs font-bold text-[#5C3317] disabled:opacity-50">Upload</button>
    </span>
    {error && <span role="alert" className="mt-1 block text-xs text-red-700">{error}</span>}
    {open && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Choose media">
      <section className="max-h-[85vh] w-full max-w-5xl overflow-y-auto  bg-white p-5 shadow-2xl">
        <header className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#3e2009]">Choose media</h2><p className="text-xs text-gray-500">Images, videos, and documents in your CMS media library.</p></div><button type="button" onClick={() => setOpen(false)} className=" bg-gray-100 px-3 py-2 text-sm font-bold">Close</button></header>
        {mediaQuery.isLoading && <p className="text-sm text-gray-500">Loading media…</p>}
        {mediaQuery.error && <p role="alert" className="text-sm text-red-700">{mediaQuery.error.message}</p>}
        {!mediaQuery.isLoading && !mediaQuery.error && mediaQuery.data?.pagination.total === 0 && <div className=" border border-dashed border-[#d8cbbb] bg-[#faf8f5] p-10 text-center text-sm text-gray-500">No matching media yet. Upload an asset to add it to the library.</div>}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{assets?.map((asset) => <button key={asset.publicId} type="button" onClick={() => choose(asset)} className="overflow-hidden  border border-gray-200 text-left transition hover:border-[#C9952A] hover:shadow-md">
          {asset.resourceType === "image" ? <img src={asset.secureUrl} alt="" className="aspect-square w-full object-cover" /> : <span className="grid aspect-square place-items-center bg-[#f8f4ef] text-4xl text-[#5C3317]">{asset.resourceType === "video" ? "▶" : "▤"}</span>}
          <span className="block truncate p-2 text-xs font-bold text-gray-700" title={asset.publicId}>{asset.publicId.split("/").pop()}</span><span className="block px-2 pb-2 text-[10px] uppercase text-gray-400">{asset.resourceType}{asset.format ? ` · ${asset.format}` : ""}</span>
        </button>)}</div>
        {!mediaQuery.isLoading && !mediaQuery.error && mediaQuery.data && <PaginationControls
          page={mediaPage}
          totalPages={mediaQuery.data.pagination.totalPages}
          totalItems={mediaQuery.data.pagination.total}
          pageSize={mediaPageSize}
          itemLabel="media items"
          lang="en"
          onPageChange={setMediaPage}
        />}
      </section>
    </div>}
  </>;
}
