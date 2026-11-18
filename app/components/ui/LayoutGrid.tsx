"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type Card = {
  id: number;
  content: React.ReactNode;
  className: string;
  thumbnail: string;
  alt: string;
};

export const LayoutGrid = ({ cards, galleryCards = cards, lang = "en" }: { cards: Card[]; galleryCards?: Card[]; lang?: string }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : galleryCards[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedIndex((current) => current === null ? null : (current - 1 + galleryCards.length) % galleryCards.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedIndex((current) => current === null ? null : (current + 1) % galleryCards.length);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, galleryCards.length]);

  function openCard(card: Card) {
    const index = galleryCards.findIndex((item) => item.id === card.id);
    if (index >= 0) setSelectedIndex(index);
  }

  const previousLabel = lang === "fr" ? "Image précédente" : "Previous image";
  const nextLabel = lang === "fr" ? "Image suivante" : "Next image";
  const closeLabel = lang === "fr" ? "Fermer la visionneuse" : "Close image viewer";
  const viewerLabel = lang === "fr" ? "Visionneuse de photos" : "Photo viewer";

  return (
    <>
      {/* Grid */}
      <div className="w-full p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto gap-3">
        {cards.map((card) => (
          <div key={card.id} className="relative w-full cursor-pointer" style={{ paddingBottom: "100%" }}>
            <motion.div
              onClick={() => openCard(card)}
              className="absolute inset-0 overflow-hidden  group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={card.thumbnail}
                alt={card.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-center transition duration-300 group-hover:scale-105"
              />
              {/* hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                <div className="p-3 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {card.content}
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {selected && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={viewerLabel}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)" }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl overflow-hidden"
              style={{ maxHeight: "80vh" }}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                aria-label={closeLabel}
                className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center border border-white/30 bg-black/70 text-white transition-colors hover:bg-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X aria-hidden="true" className="size-5" />
              </button>

              <span aria-live="polite" className="absolute left-3 top-3 z-20 bg-black/70 px-3 py-2 text-[10px] font-bold tracking-[0.16em] text-white sm:left-4 sm:top-4">
                {String(selectedIndex + 1).padStart(2, "0")} / {String(galleryCards.length).padStart(2, "0")}
              </span>

              <button
                type="button"
                aria-label={previousLabel}
                onClick={() => setSelectedIndex((current) => current === null ? null : (current - 1 + galleryCards.length) % galleryCards.length)}
                className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-black/70 text-white transition-colors hover:bg-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
              >
                <ChevronLeft aria-hidden="true" className="size-6" />
              </button>

              <button
                type="button"
                aria-label={nextLabel}
                onClick={() => setSelectedIndex((current) => current === null ? null : (current + 1) % galleryCards.length)}
                className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-black/70 text-white transition-colors hover:bg-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
              >
                <ChevronRight aria-hidden="true" className="size-6" />
              </button>

              {/* Image */}
              <div className="relative w-full" style={{ height: "min(70vh, 760px)" }}>
                <Image
                  src={selected.thumbnail}
                  alt={selected.alt}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>

              {/* Caption */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pt-12 sm:p-6 sm:pt-16">
                {selected.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
