"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title: string;
  number: string;
  onClose: () => void;
}

export default function PdfViewer({ url, title, number, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Build absolute URL so react-pdf fetches from the correct origin/port
  const absoluteUrl = typeof window !== "undefined"
    ? `${window.location.origin}${url}`
    : url;

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(26,20,16,0.9)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-xl overflow-hidden flex flex-col"
        style={{ height: "92vh", background: "#1a1410", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--gold)]">{number}</p>
            <p className="text-sm font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>{title}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Page controls */}
            {numPages > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span className="text-xs text-white/70 min-w-[60px] text-center">
                  {currentPage} / {numPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  disabled={currentPage === numPages}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            )}
            {/* Download */}
            <a
              href={url}
              download
              className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-[var(--gold)] transition-colors"
              title="Download"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-red-500/60 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* PDF content */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center py-4 px-2" style={{ background: "#2a2a2a" }}>
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <Document
            file={absoluteUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setLoading(false)}
            loading=""
          >
            <Page
              pageNumber={currentPage}
              width={Math.min(typeof window !== "undefined" ? window.innerWidth * 0.85 : 800, 900)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
