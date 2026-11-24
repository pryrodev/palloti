"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cmsQueryKeys } from "@/lib/useCmsCollection";
import type { MediaAsset } from "@/app/admin/sections/CloudinaryMediaPicker";

export type PageInfo = { page: number; pageSize: number; total: number; totalPages: number; offset: number };
export type GalleryItem = { src: string; title: string; sub: string };
export type GalleryPage = { data: GalleryItem[]; pagination: PageInfo; revision: number };
export type MediaPage = { items: MediaAsset[]; pagination: PageInfo };
export type DashboardSummary = { stats: { news: { en: number; fr: number }; publications: number; gallery: number; videos: number }; recentNews: { id: number; slug?: string; title: string; date: string; tags: string; summary: string }[] };

async function json<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || fallback);
  }
  return response.json() as Promise<T>;
}

export async function fetchGalleryPage(page: number, pageSize: number, signal: AbortSignal) {
  const response = await fetch(`/api/admin/gallery?page=${page}&pageSize=${pageSize}`, { credentials: "include", cache: "no-store", signal });
  const result = await json<Omit<GalleryPage, "revision">>(response, "Could not load gallery.");
  const revision = Number(response.headers.get("X-CMS-Revision"));
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error("The gallery response is missing its revision.");
  return { ...result, revision };
}
export async function saveGalleryPage(input: { page: number; pageSize: number; items: GalleryItem[]; expectedRevision: number }) {
  return json<{ revision: number }>(await fetch("/api/admin/gallery", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": `"${input.expectedRevision}"` }, body: JSON.stringify(input) }), "Could not save gallery.");
}
export async function deleteGalleryPhoto(input: { index: number; src: string; expectedRevision: number }) {
  return json(await fetch("/api/admin/gallery", { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": `"${input.expectedRevision}"` }, body: JSON.stringify(input) }), "Could not delete this photo.");
}
export async function addGalleryPhoto(photo: GalleryItem) {
  return json(await fetch("/api/admin/gallery", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: [photo] }) }), "Could not add photo.");
}
export async function fetchDashboardSummary(signal: AbortSignal) {
  return json<DashboardSummary>(await fetch("/api/admin/dashboard", { signal, credentials: "include" }), "Failed to load dashboard overview");
}
export async function fetchMediaPage(page: number, pageSize: number, resourceType: string | undefined, signal: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (resourceType && resourceType !== "all") params.set("resourceType", resourceType);
  return json<MediaPage>(await fetch(`/api/admin/media?${params}`, { credentials: "include", cache: "no-store", signal }), "Could not load media.");
}
export async function renameMedia(input: { id: string; name: string }) {
  return json(await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(input) }), "Could not rename media.");
}
export async function backfillMediaNames() {
  return json<{ updated?: number; total?: number; failed?: number; message?: string; error?: string; errors?: string[] }>(await fetch("/api/admin/media/backfill-names", { method: "POST", credentials: "include" }), "Failed to connect to media service.");
}
export async function registerMediaAsset(asset: MediaAsset) {
  return json(await fetch("/api/admin/media", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(asset) }), "The asset could not be added to the media library.");
}
export async function importDriveMedia(input: { fileId: string; accessToken: string; resourceType?: string }) {
  return json<MediaAsset>(await fetch("/api/admin/media/import-drive", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }), "Could not import this Drive file.");
}
export async function getCloudinaryCredentials() {
  return json<{ cloudName?: string; apiKey?: string }>(await fetch("/api/admin/cloudinary-signature", { credentials: "include" }), "Could not load Cloudinary credentials.");
}
export async function signCloudinaryUpload(params: Record<string, string | number>) {
  return json<{ signature: string }>(await fetch("/api/admin/cloudinary-signature", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) }), "Could not sign upload.");
}

export function useGalleryPage(page: number, pageSize: number) {
  return useQuery({ queryKey: cmsQueryKeys.galleryPage(page, pageSize), queryFn: ({ signal }) => fetchGalleryPage(page, pageSize, signal), staleTime: 60_000 });
}
export function useGalleryMutations(page: number, pageSize: number) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: cmsQueryKeys.galleryPages() });
  const save = useMutation({ mutationFn: (input: { items: GalleryItem[]; expectedRevision: number }) => saveGalleryPage({ page, pageSize, ...input }), onSuccess: invalidate, onError: invalidate });
  const remove = useMutation({ mutationFn: deleteGalleryPhoto, onSuccess: invalidate, onError: invalidate });
  const add = useMutation({ mutationFn: addGalleryPhoto, onSuccess: invalidate });
  return {
    save,
    remove,
    add,
  };
}
export function useDashboardSummary() {
  return useQuery({ queryKey: cmsQueryKeys.dashboard(), queryFn: ({ signal }) => fetchDashboardSummary(signal), staleTime: 30_000 });
}
export function useMediaPage(page: number, pageSize: number, resourceType?: string, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({ queryKey: cmsQueryKeys.mediaPage(page, pageSize, resourceType), queryFn: ({ signal }) => fetchMediaPage(page, pageSize, resourceType, signal), enabled: options?.enabled, refetchInterval: options?.refetchInterval ?? false });
}
export function useMediaMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: cmsQueryKeys.media });
  const backfill = useMutation({ mutationFn: backfillMediaNames, onSuccess: invalidate });
  const rename = useMutation({ mutationFn: renameMedia, onSuccess: invalidate });
  const register = useMutation({ mutationFn: registerMediaAsset, onSuccess: invalidate });
  const importDrive = useMutation({ mutationFn: importDriveMedia, onSuccess: invalidate });
  return {
    backfill,
    rename,
    register,
    importDrive,
  };
}
