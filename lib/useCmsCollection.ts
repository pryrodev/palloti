"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cmsSchemas, type CmsCollectionKey } from "@/lib/cmsSchemas";

const collectionUrl = (key: CmsCollectionKey) => `/api/admin/${key}`;
export const cmsQueryKeys = {
  all: ["cms"] as const,
  collection: (key: CmsCollectionKey) => ["cms", "collection", key] as const,
  media: ["cms", "media"] as const,
};

async function fetchCollection<T>(key: CmsCollectionKey): Promise<T> {
  const response = await fetch(collectionUrl(key), { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error((await response.json()).error ?? "Could not load content");
  return response.json();
}

async function saveCollection<T>(key: CmsCollectionKey, payload: T): Promise<T> {
  cmsSchemas[key].parse(payload);
  const response = await fetch(collectionUrl(key), {
    method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.issues?.map((issue: { message: string }) => issue.message).join(" ") ?? body.error ?? "Save failed");
  }
  return payload;
}

export function useCmsCollection<T>(key: CmsCollectionKey) {
  return useQuery({ queryKey: cmsQueryKeys.collection(key), queryFn: () => fetchCollection<T>(key), refetchInterval: 15_000 });
}

export function useSaveCmsCollection<T>(key: CmsCollectionKey) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: T) => saveCollection(key, payload),
    onSuccess: (payload) => {
      client.setQueryData(cmsQueryKeys.collection(key), payload);
      client.invalidateQueries({ queryKey: cmsQueryKeys.collection(key) });
    },
  });
}
