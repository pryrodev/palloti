"use client";

import Script from "next/script";
import Image from "next/image";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileUp, FolderOpen, HardDrive, ImagePlus, LoaderCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PaginationControls from "@/components/ui/PaginationControls";
import { cmsQueryKeys } from "@/lib/useCmsCollection";

export type MediaAsset = {
  id?: string;
  publicId: string;
  name?: string;
  url: string;
  secureUrl: string;
  provider?: "cloudinary" | "local";
  resourceType: "image" | "video" | "raw";
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

type GoogleDriveFile = { id: string; name: string; mimeType: string };
type GooglePickerResult = { action: string; docs?: GoogleDriveFile[] };
type GooglePickerView = {
  setMimeTypes(mimeTypes: string): GooglePickerView;
  setIncludeFolders(includeFolders: boolean): GooglePickerView;
};
type GooglePickerBuilder = {
  setAppId(appId: string): GooglePickerBuilder;
  setDeveloperKey(apiKey: string): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setOrigin(origin: string): GooglePickerBuilder;
  addView(view: GooglePickerView): GooglePickerBuilder;
  setCallback(callback: (result: GooglePickerResult) => void): GooglePickerBuilder;
  build(): { setVisible(visible: boolean): void };
};

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: { event?: string; info?: Record<string, unknown> }) => void,
      ) => { open: () => void };
    };
    gapi?: { load: (name: string, callback: () => void) => void };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (result: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
      picker?: {
        Action: { PICKED: string };
        ViewId: { DOCS: string };
        DocsView: new (viewId: string) => GooglePickerView;
        PickerBuilder: new () => GooglePickerBuilder;
      };
    };
  }
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
const GOOGLE_DRIVE_READY = Boolean(GOOGLE_API_KEY && GOOGLE_CLIENT_ID && GOOGLE_APP_ID);

/** Returns a human-readable display name for a media asset.
 *  Priority: stored name → last segment of publicId → secureUrl basename.
 */
function assetDisplayName(asset: MediaAsset): string {
  if (asset.name?.trim()) return asset.name.trim();
  const fromPublicId = asset.publicId?.split("/").pop() ?? "";
  if (fromPublicId) return fromPublicId;
  try {
    return new URL(asset.secureUrl).pathname.split("/").pop() ?? asset.secureUrl;
  } catch {
    return asset.secureUrl;
  }
}

/** Format bytes as KB / MB */
function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function CloudinaryMediaPicker({
  onSelect,
  label = "Choose from media",
  resourceType,
}: {
  onSelect: (asset: MediaAsset) => void;
  label?: string;
  resourceType?: MediaAsset["resourceType"];
}) {
  const queryClient = useQueryClient();
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googlePickerReady, setGooglePickerReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"sources" | "library">("sources");
  const [mediaPage, setMediaPage] = useState(1);
  const [error, setError] = useState("");
  const [driveImporting, setDriveImporting] = useState(false);
  const mediaPageSize = 20;

  const mediaQuery = useQuery<{
    items: MediaAsset[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number; offset: number };
  }>({
    queryKey: cmsQueryKeys.mediaPage(mediaPage, mediaPageSize, resourceType),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(mediaPage), pageSize: String(mediaPageSize) });
      if (resourceType) params.set("resourceType", resourceType);
      const response = await fetch(`/api/admin/media?${params}`, {
        credentials: "include",
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Could not load the media library.");
      return response.json();
    },
    enabled: open && view === "library",
    refetchInterval: false,
  });
  const assets = mediaQuery.data?.items ?? [];

  async function saveAsset(info: Record<string, unknown>) {
    // Derive a human-readable name: prefer original_filename, fall back to the last segment of publicId
    const rawName = typeof info.original_filename === "string" && info.original_filename.trim()
      ? info.original_filename.trim()
      : typeof info.public_id === "string"
        ? (info.public_id as string).split("/").pop() ?? ""
        : "";
    const name = rawName.slice(0, 255) || undefined;

    const asset: MediaAsset = {
      publicId: String(info.public_id ?? ""),
      name,
      url: String(info.url ?? info.secure_url ?? ""),
      secureUrl: String(info.secure_url ?? info.url ?? ""),
      resourceType: String(info.resource_type) === "video" ? "video" : String(info.resource_type) === "raw" ? "raw" : "image",
      format: typeof info.format === "string" ? info.format : undefined,
      bytes: typeof info.bytes === "number" ? info.bytes : undefined,
      width: typeof info.width === "number" ? info.width : undefined,
      height: typeof info.height === "number" ? info.height : undefined,
    };
    const response = await fetch("/api/admin/media", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(asset),
    });
    if (!response.ok) throw new Error("The asset could not be added to the media library.");
    await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.media });
    onSelect(asset);
  }

  function uploadFromComputer() {
    setError("");
    if (!window.cloudinary || !cloudinaryReady || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY) {
      setError("Computer uploads are not ready. Check the Cloudinary configuration and try again.");
      return;
    }
    const widget = window.cloudinary.createUploadWidget({
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      uploadSignature: async (callback: (signature: string) => void, params: Record<string, string | number>) => {
        const response = await fetch("/api/admin/cloudinary-signature", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not sign upload");
        callback(result.signature);
      },
      resourceType: resourceType ?? "auto",
      sources: ["local"],
      multiple: false,
      folder: "pallotti-cms",
      clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif", "avif", "mp4", "mov", "webm", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
      maxFileSize: 100_000_000,
      showAdvancedOptions: false,
    }, async (widgetError, result) => {
      if (widgetError) {
        setError("Cloudinary could not open the upload widget.");
        return;
      }
      if (result.event !== "success" || !result.info) return;
      try {
        await saveAsset(result.info);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Could not save this upload.");
      }
    });
    widget.open();
  }

  async function importFromDrive(fileId: string, accessToken: string) {
    setDriveImporting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/media/import-drive", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, accessToken, resourceType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not import this Drive file.");
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.media });
      onSelect(result as MediaAsset);
      setOpen(false);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not import this Drive file.");
    } finally {
      setDriveImporting(false);
    }
  }

  function openGoogleDrive() {
    setError("");
    if (!GOOGLE_DRIVE_READY) {
      setError("Google Drive is not configured yet. Add the Google API key, OAuth client ID, and project number.");
      return;
    }
    if (!googleReady || !googlePickerReady || !window.google?.accounts?.oauth2 || !window.google.picker) {
      setError("Google Drive is still loading. Try again in a moment.");
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID!,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (tokenResponse) => {
        if (!tokenResponse.access_token || tokenResponse.error) {
          setError("Google Drive access was not granted.");
          return;
        }

        const typeFilters = resourceType === "image"
          ? "image/jpeg,image/png,image/webp,image/gif,image/avif"
          : resourceType === "video"
            ? "video/mp4,video/quicktime,video/webm"
            : resourceType === "raw"
              ? "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet,application/vnd.google-apps.presentation"
              : "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/quicktime,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet,application/vnd.google-apps.presentation";
        const view = new window.google!.picker!.DocsView(window.google!.picker!.ViewId.DOCS)
          .setMimeTypes(typeFilters)
          .setIncludeFolders(false);
        const picker = new window.google!.picker!.PickerBuilder()
          .setAppId(GOOGLE_APP_ID!)
          .setDeveloperKey(GOOGLE_API_KEY!)
          .setOAuthToken(tokenResponse.access_token!)
          .setOrigin(window.location.origin)
          .addView(view)
          .setCallback((pickerResult) => {
            if (pickerResult.action !== window.google!.picker!.Action.PICKED) return;
            const file = pickerResult.docs?.[0];
            if (!file) {
              setError("Select a file from Google Drive to import it.");
              return;
            }
            setOpen(false);
            void importFromDrive(file.id, tokenResponse.access_token!);
          })
          .build();
        picker.setVisible(true);
      },
    });
    tokenClient.requestAccessToken({ prompt: "" });
  }

  function choose(asset: MediaAsset) {
    onSelect(asset);
    setOpen(false);
  }

  function openSources() {
    setError("");
    setMediaPage(1);
    setView("sources");
    setOpen(true);
  }

  const anyGoogleScripts = GOOGLE_DRIVE_READY;

  return <>
    <Script src="https://upload-widget.cloudinary.com/latest/global/all.js" onReady={() => setCloudinaryReady(true)} />
    {anyGoogleScripts && <>
      <Script src="https://accounts.google.com/gsi/client" onReady={() => setGoogleReady(true)} />
      <Script src="https://apis.google.com/js/api.js" onReady={() => {
        window.gapi?.load("picker", () => setGooglePickerReady(true));
      }} />
    </>}

    <Button type="button" size="sm" variant="outline" onClick={openSources}>
      <ImagePlus data-icon="inline-start" />
      {label}
    </Button>
    {error && <p role="alert" aria-live="polite" className="mt-2 text-xs text-destructive">{error}</p>}
    {driveImporting && <p role="status" aria-live="polite" className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5" /> Importing from Google Drive…</p>}

    <Sheet open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) setView("sources");
    }}>
      <SheetContent side="right" className="data-[side=right]:w-[min(96vw,64rem)] data-[side=right]:sm:max-w-none gap-0 overflow-hidden p-0">
        <SheetHeader className="shrink-0 border-b border-border px-6 py-4 pr-14">
          <SheetTitle>{view === "sources" ? "Add media" : "Choose from media"}</SheetTitle>
        </SheetHeader>
        {error && <p role="alert" aria-live="polite" className="mx-4 mt-4 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

        {view === "sources" ? <div className="grid gap-3 p-6 sm:grid-cols-3">
          <Button type="button" size="lg" variant="outline" className="w-full justify-start" onClick={() => setView("library")}>
            <FolderOpen data-icon="inline-start" className="text-primary" /> Choose from media
          </Button>
          <Button type="button" size="lg" variant="outline" className="w-full justify-start" onClick={uploadFromComputer}>
            <FileUp data-icon="inline-start" className="text-primary" /> From local computer
          </Button>
          <Button type="button" size="lg" variant="outline" className="w-full justify-start" onClick={openGoogleDrive} disabled={driveImporting}>
            <HardDrive data-icon="inline-start" className="text-primary" /> From Google Drive
          </Button>
        </div> : <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setView("sources")}>
              <ArrowLeft data-icon="inline-start" />
              Back to sources
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void mediaQuery.refetch()} disabled={mediaQuery.isFetching}>
              <RotateCw data-icon="inline-start" />
              Refresh
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {mediaQuery.isLoading && <div role="status" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, index) => <div key={index} className="overflow-hidden border border-border">
                <div className="aspect-square bg-muted" />
                <div className="h-10 bg-muted/50" />
              </div>)}
            </div>}
            {mediaQuery.error && <div role="alert" className="flex flex-col items-start gap-3 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <p>{mediaQuery.error.message}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void mediaQuery.refetch()}>Try again</Button>
            </div>}
            {!mediaQuery.isLoading && !mediaQuery.error && mediaQuery.data?.pagination.total === 0 && <div className="border border-dashed border-border bg-muted/30 p-10 text-center">
              <p className="text-sm font-medium">No matching media yet</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" onClick={uploadFromComputer}>Upload from local computer</Button>
                <Button type="button" size="sm" variant="outline" onClick={openGoogleDrive}>Choose from Google Drive</Button>
              </div>
            </div>}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {assets.map((asset) => {
                const displayName = assetDisplayName(asset);
                const sizeLabel = formatBytes(asset.bytes);
                const typeIcon = asset.resourceType === "video" ? "▶" : asset.format?.toLowerCase() === "pdf" ? "📄" : "📎";
                return <button
                  key={asset.publicId}
                  type="button"
                  onClick={() => choose(asset)}
                  title={displayName}
                  className="group overflow-hidden border border-border text-left transition-all duration-150 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {asset.resourceType === "image" ? (
                    <div className="relative aspect-square w-full"><Image src={asset.secureUrl} alt="" fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw" className="object-cover" /></div>
                  ) : (
                    <span className="grid aspect-square place-items-center bg-muted text-4xl text-primary transition-transform duration-150 group-hover:scale-110">
                      {typeIcon}
                    </span>
                  )}
                  <div className="p-2">
                    <span className="block truncate text-xs font-semibold text-foreground leading-snug">{displayName}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span>{asset.format ?? asset.resourceType}</span>
                      {sizeLabel && <><span className="opacity-40">·</span><span>{sizeLabel}</span></>}
                    </span>
                  </div>
                </button>;
              })}
            </div>
            {!mediaQuery.isLoading && !mediaQuery.error && mediaQuery.data && mediaQuery.data.pagination.total > 0 && <PaginationControls
              page={mediaPage}
              totalPages={mediaQuery.data.pagination.totalPages}
              totalItems={mediaQuery.data.pagination.total}
              pageSize={mediaPageSize}
              itemLabel="media items"
              lang="en"
              onPageChange={setMediaPage}
            />}
          </div>
        </div>}
      </SheetContent>
    </Sheet>
  </>;
}
