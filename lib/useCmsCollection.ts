"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CmsCollectionKey } from "@/lib/cmsSchemas";
import { fetchCmsCollection, saveCmsCollection } from "@/lib/cmsApi";

export const cmsQueryKeys = {
  all: ["cms"] as const,
  collection: (key: CmsCollectionKey) => ["cms", "collection", key] as const,
  galleryPages: () => ["cms", "gallery"] as const,
  galleryPage: (page: number, pageSize: number) => [...cmsQueryKeys.galleryPages(), page, pageSize] as const,
  dashboard: () => ["cms", "dashboard-summary"] as const,
  media: ["cms", "media"] as const,
  mediaPage: (page: number, pageSize: number, resourceType?: string) => ["cms", "media", page, pageSize, resourceType ?? "all"] as const,
};

export function useCmsCollection<T>(key: CmsCollectionKey) {
  const query = useQuery({
    queryKey: cmsQueryKeys.collection(key),
    queryFn: ({ signal }) => fetchCmsCollection<T>(key, signal),
    staleTime: 60_000,
  });
  return { ...query, data: query.data?.payload, revision: query.data?.revision };
}

export function useSaveCmsCollection<T>(key: CmsCollectionKey, getExpectedRevision: () => number | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: T) => {
      const expectedRevision = getExpectedRevision();
      if (expectedRevision === null) throw new Error("Wait for the latest content revision before saving.");
      await client.cancelQueries({ queryKey: cmsQueryKeys.collection(key) });
      const revision = await saveCmsCollection(key, payload, expectedRevision);
      return { payload, revision };
    },
    onSuccess: ({ payload, revision }) => client.setQueryData(cmsQueryKeys.collection(key), { payload, revision }),
  });
}
