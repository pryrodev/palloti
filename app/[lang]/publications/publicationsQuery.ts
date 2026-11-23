import { useQuery } from "@tanstack/react-query";

export type Publication = {
  id: number | string;
  slug?: string;
  number: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  subtitle: string;
  description: string;
  color?: string;
  titleColor?: string;
  subtitleColor?: string;
  url?: string;
  coverImage?: string;
  fileType?: "pdf" | "image";
};

export type PublicationPage = {
  items: Publication[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; offset: number };
};

export const publicationQueryKeys = {
  publicList: ["publications", "public"] as const,
  publicPage: (page: number, pageSize: number) => ["publications", "public", page, pageSize] as const,
};

export async function fetchPublishedPublications(page: number, pageSize: number, signal: AbortSignal): Promise<PublicationPage> {
  const response = await fetch(`/api/admin/publications-public?page=${page}&pageSize=${pageSize}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load publications.");
  return response.json() as Promise<PublicationPage>;
}

export function usePublications(page: number, pageSize: number) {
  return useQuery({
    queryKey: publicationQueryKeys.publicPage(page, pageSize),
    queryFn: ({ signal }) => fetchPublishedPublications(page, pageSize, signal),
    staleTime: 60_000,
  });
}
