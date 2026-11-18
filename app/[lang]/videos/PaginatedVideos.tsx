"use client";

import { useState } from "react";
import VideoPlayer from "../../components/VideoPlayer";
import PaginationControls from "@/components/ui/PaginationControls";

type Video = { src: string; poster: string; title: string };
const PAGE_SIZE = 4;

export default function PaginatedVideos({ videos, lang }: { videos: Video[]; lang: string }) {
  const [page, setPage] = useState(1);
  const visibleVideos = videos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(videos.length / PAGE_SIZE);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {visibleVideos.map((video) => (
          <VideoPlayer key={video.src} src={video.src} poster={video.poster} title={video.title} />
        ))}
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalItems={videos.length} pageSize={PAGE_SIZE} itemLabel={lang === "fr" ? "vidéos" : "videos"} lang={lang} onPageChange={setPage} />
    </>
  );
}
