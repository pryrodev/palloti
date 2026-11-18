"use client";

import { useState } from "react";
import { LayoutGrid, type Card } from "../../components/ui/LayoutGrid";
import PaginationControls from "@/components/ui/PaginationControls";

type GalleryImage = { src: string; title: string; sub: string };
const PAGE_SIZE = 12;
const CARD_PATTERNS = ["md:col-span-2", "col-span-1", "col-span-1", "col-span-1", "md:col-span-2", "col-span-1", "col-span-1", "col-span-1", "md:col-span-2", "col-span-1", "col-span-1", "col-span-1"];

export default function PaginatedGallery({ images, lang }: { images: GalleryImage[]; lang: string }) {
  const [page, setPage] = useState(1);
  const allCards: Card[] = images.map((image, index) => ({
    id: index + 1,
    thumbnail: image.src,
    alt: image.title,
    className: CARD_PATTERNS[index % CARD_PATTERNS.length],
    content: (
      <div>
        <p className="font-sans text-base font-bold text-white md:text-xl">{image.title}</p>
        <p className="mt-1 font-sans text-base font-normal text-white/80">{image.sub}</p>
      </div>
    ),
  }));
  const cards = allCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(images.length / PAGE_SIZE);

  return (
    <>
      <LayoutGrid cards={cards} galleryCards={allCards} lang={lang} />
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
        <PaginationControls page={page} totalPages={totalPages} totalItems={images.length} pageSize={PAGE_SIZE} itemLabel={lang === "fr" ? "photos" : "photos"} lang={lang} onPageChange={setPage} />
      </div>
    </>
  );
}
