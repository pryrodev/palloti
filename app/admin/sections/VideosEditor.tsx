"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, Pencil, Play, Trash2, X } from "lucide-react";
import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import DataTable from "../components/DataTable";

type Video = { src: string; poster: string; title: string };

export default function VideosEditor() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [playerError, setPlayerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);
  const savingLock = useRef(false);
  const query = useCmsCollection<Video[]>("videos");
  const saveCollection = useSaveCmsCollection<Video[]>("videos", () => serverRevision.current);

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify(videos);
    if (serverSnapshot.current === null) {
      setVideos(query.data);
      serverSnapshot.current = incoming;
      serverRevision.current = query.revision ?? null;
    } else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) {
        setVideos(query.data);
        serverSnapshot.current = incoming;
      }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, videos]);

  const persist = useCallback(async (nextVideos: Video[], successMessage: string) => {
    if (savingLock.current) return false;
    savingLock.current = true;
    setSaving(true);
    setMessage("");
    try {
      const saved = await saveCollection.mutateAsync(nextVideos);
      setVideos(nextVideos);
      serverSnapshot.current = JSON.stringify(nextVideos);
      serverRevision.current = saved.revision;
      setMessage(successMessage);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save videos.");
      void query.refetch();
      return false;
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }, [saveCollection, query]);

  const saveRow = useCallback(async (index: number) => {
    if (!editingVideo || savingLock.current) return;
    const nextVideos = videos.map((video, videoIndex) => videoIndex === index ? editingVideo : video);
    if (await persist(nextVideos, "Video updated.")) {
      setEditingIndex(null);
      setEditingVideo(null);
    }
  }, [editingVideo, videos, persist]);

  const addVideo = useCallback(async (asset: { resourceType: string; secureUrl: string; publicId: string }) => {
    if (asset.resourceType !== "video") {
      setMessage("Choose a video asset.");
      return;
    }
    const video: Video = {
      src: asset.secureUrl,
      poster: "/images/gikondo.jpg",
      title: asset.publicId.split("/").pop() ?? "Video",
    };
    await persist([...videos, video], "Video added.");
  }, [videos, persist]);

  const removeVideo = useCallback((index: number) => {
    return persist(videos.filter((_, videoIndex) => videoIndex !== index), "Video removed.");
  }, [videos, persist]);

  const columns = useMemo<ColumnDef<DataGridFeatures, Video>[]>(() => [
    {
      id: "index",
      header: "#",
      enableSorting: false,
      size: 52,
      minSize: 52,
      maxSize: 52,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.index + 1}</span>,
    },
    {
      id: "preview",
      header: "Poster",
      enableSorting: false,
      size: 132,
      minSize: 132,
      maxSize: 132,
      cell: ({ row }) => <button type="button" onClick={() => { setPlayerError(""); setPlayingVideo(row.original); }} aria-label={`Play ${row.original.title}`} className="group relative block h-14 w-24 border border-border bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        {row.original.poster && <Image src={row.original.poster} alt={`${row.original.title} poster`} fill unoptimized sizes="96px" loading={row.index === 0 ? "eager" : "lazy"} className="object-cover" />}
        <span className="absolute inset-0 grid place-items-center bg-black/30 text-white"><Play aria-hidden="true" className="size-5" /></span>
      </button>,
    },
    {
      accessorKey: "title",
      size: 320,
      minSize: 260,
      header: ({ column }) => <DataGridColumnHeader title="Title" column={column} />,
      cell: ({ row }) => {
        const index = row.index;
        const isEditing = editingIndex === index && editingVideo !== null;
        return isEditing ? <label className="block">
          <span className="sr-only">Video title</span>
          <input autoFocus value={editingVideo.title} disabled={saving} onChange={(event) => setEditingVideo((current) => current ? { ...current, title: event.target.value } : current)} className="w-full min-w-0 border border-input bg-background px-2 py-1.5 text-sm font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
        </label> : <span className="break-words text-sm font-semibold text-foreground">{row.original.title}</span>;
      },
    },
    {
      accessorKey: "src",
      size: 340,
      minSize: 260,
      header: ({ column }) => <DataGridColumnHeader title="Video file" column={column} />,
      cell: ({ row }) => <input aria-label={`Video file for ${row.original.title}`} value={row.original.src} readOnly title={row.original.src} className="w-full min-w-0 border border-input bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground" />,
    },
    {
      id: "posterAction",
      header: "Poster image",
      enableSorting: false,
      size: 180,
      minSize: 180,
      maxSize: 180,
      cell: ({ row }) => editingIndex === row.index && editingVideo ? <CloudinaryMediaPicker
        label="Choose poster"
        resourceType="image"
        onSelect={(asset) => setEditingVideo((current) => current ? { ...current, poster: asset.secureUrl } : current)}
      /> : <span className="text-xs text-muted-foreground">{row.original.poster ? "Poster set" : "No poster"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      size: 180,
      minSize: 180,
      maxSize: 180,
      cell: ({ row }) => {
        const index = row.index;
        const isEditing = editingIndex === index;
        return isEditing ? <div className="flex items-center gap-2">
          <Button type="button" size="sm" disabled={saving || !editingVideo?.title.trim()} className="bg-[#5C3317] text-white hover:bg-[#70411e]" style={{ backgroundColor: "#5C3317", color: "#fff" }} onClick={() => void saveRow(index)}>
            <Check data-icon="inline-start" />{saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => { setEditingIndex(null); setEditingVideo(null); }}>
            <X data-icon="inline-start" />Cancel
          </Button>
        </div> : <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={saving || editingIndex !== null} onClick={() => { setEditingIndex(index); setEditingVideo({ ...row.original }); setMessage(""); }}>
            <Pencil data-icon="inline-start" />Edit
          </Button>
          <ConfirmDeleteAction
            title="Are you sure?"
            description={`You are about to delete the video “${row.original.title}”. This action cannot be undone.`}
            confirmLabel="Delete"
            disabled={saving || editingIndex !== null}
            onConfirm={() => removeVideo(index)}
          >
            <Trash2 data-icon="inline-start" />Remove
          </ConfirmDeleteAction>
        </div>;
      },
    },
  ], [editingIndex, editingVideo, saving, saveRow, removeVideo]);

  return <section className="flex flex-col gap-4">
    {query.isLoading && <p role="status" className="text-sm text-muted-foreground">Loading videos…</p>}
    {query.error && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}
    {message && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</p>}

    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{videos.length} videos</p>
      <CloudinaryMediaPicker label="Add video" resourceType="video" onSelect={(asset) => void addVideo(asset)} />
    </div>

    <DataTable
      columns={columns}
      data={videos}
      getRowId={(video) => String(videos.indexOf(video))}
      isLoading={query.isLoading}
      emptyMessage="No videos yet. Add a video from the media library to get started."
      pageSize={10}
      pageSizes={[10, 20, 50]}
    />

    <Dialog.Root open={playingVideo !== null} onOpenChange={(open) => { if (!open) setPlayingVideo(null); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[min(94vw,64rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto overscroll-contain border border-border bg-background p-3 text-foreground shadow-lg sm:p-4">
          {playingVideo && <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Dialog.Title className="text-base font-semibold tracking-tight">{playingVideo.title}</Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">Video preview. Playback starts muted; use the player controls to turn on sound.</Dialog.Description>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={playingVideo.src} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#5C3317] underline underline-offset-2">Open video file</a>
                <Dialog.Close render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Close video player" />}>
                  <X aria-hidden="true" />
                </Dialog.Close>
              </div>
            </div>
            <video key={playingVideo.src} src={playingVideo.src} controls autoPlay muted playsInline preload="metadata" poster={playingVideo.poster} onError={(event) => {
              const mediaError = event.currentTarget.error;
              const details: Record<number, string> = {
                1: "Playback was interrupted.",
                2: "The browser could not download the video.",
                3: "The video downloaded but could not be decoded.",
                4: "The browser does not support this video source.",
              };
              setPlayerError(`${details[mediaError?.code ?? 0] ?? "The browser could not play this video."} (media error ${mediaError?.code ?? "unknown"})`);
            }} className="max-h-[72vh] w-full bg-black">
              Your browser does not support video playback.
            </video>
            {playerError && <p role="alert" className="text-sm text-destructive">{playerError}</p>}
          </>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}
