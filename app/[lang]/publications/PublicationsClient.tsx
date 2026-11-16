"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("../../components/PdfViewer"), { ssr: false });

type Book = {
  id: number;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  titleColor: string;
  subtitleColor: string;
  url?: string;
};

export default function PublicationsClient({ lang }: { lang: string }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [openPdf, setOpenPdf] = useState<Book | null>(null);
  const isFr = lang === "fr";

  useEffect(() => {
    fetch("/api/admin/publications-public")
      .then((r) => r.json())
      .then(setBooks)
      .catch(() => {});
  }, []);

  return (
    <div>
      {openPdf?.url && (
        <PdfViewer
          url={openPdf.url}
          title={openPdf.title}
          number={`PSF / ${openPdf.number}`}
          onClose={() => setOpenPdf(null)}
        />
      )}

      <div className="flex flex-row flex-wrap justify-center gap-8">
        {books.map((book) => (
          <div
            key={book.id}
            className="group cursor-pointer"
            style={{ width: "340px" }}
            onClick={() => book.url && setOpenPdf(book)}
          >
            <div className="flex flex-row items-center gap-4">
              {/* Book cover */}
              <div
                className="relative flex-shrink-0 rounded-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl"
                style={{
                  width: "190px", height: "260px",
                  background: book.color,
                  boxShadow: "4px 6px 20px rgba(0,0,0,0.3), inset 3px 0 6px rgba(0,0,0,0.2)",
                  padding: "14px", display: "flex", flexDirection: "column",
                }}
              >
                <p style={{ color: book.titleColor, fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6 }}>
                  PSF / {book.number}
                </p>
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <p style={{ fontFamily: "Georgia, serif", color: book.titleColor, fontSize: "17px", fontWeight: 900, lineHeight: 1.3 }}>
                    {book.title}
                  </p>
                </div>
                <p style={{ color: book.subtitleColor, fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.9 }}>
                  {book.subtitle}
                </p>
                <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-sm"
                  style={{ background: "linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.05) 60%, transparent)" }} />
              </div>

              {/* Info panel */}
              <div className="flex flex-col justify-center flex-1 gap-2" style={{ minHeight: "260px" }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", fontWeight: 900, color: "var(--dark)", lineHeight: 1.4 }}>
                  {book.title}
                </p>
                <p style={{ fontSize: "13px", color: "var(--gray)", lineHeight: 1.7, textAlign: "justify" }}>
                  {book.description}
                </p>
                <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--red)" }}
                  className="transition-colors group-hover:text-[var(--gold)]">
                  {isFr ? "LIRE PLUS" : "READ MORE"} ↗
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
