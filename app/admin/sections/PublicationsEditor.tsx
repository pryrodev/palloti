"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import { createSeoMetadata } from "@/lib/seoMetadata";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import PaginationControls from "@/components/ui/PaginationControls";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";

type Book = { id: number; slug?: string; number: string; title: string; seoTitle?: string; seoDescription?: string; subtitle: string; description: string; color?: string; titleColor?: string; subtitleColor?: string; url?: string; coverImage?: string; fileType?: "pdf" | "image" };
const COLORS = ["#5C3317", "#3A1F0A", "#7A4520", "#C9952A", "#2C4A1E", "#1A3A5C", "#4A2060", "#1A4A3A"];
const EMPTY: Omit<Book, "id" | "number"> = { slug: "", title: "", seoTitle: "", seoDescription: "", subtitle: "Document", description: "", color: COLORS[0], titleColor: "#ffffff", subtitleColor: "#C9952A", url: "", coverImage: "", fileType: "pdf" };

function getDownloadUrl(value: string) {
  try {
    const isRelative = value.startsWith("/");
    const url = new URL(value, "https://local.invalid");
    if (url.hostname === "res.cloudinary.com" && url.pathname.includes("/upload/") && !url.pathname.includes("/upload/fl_attachment/")) {
      url.pathname = url.pathname.replace("/upload/", "/upload/fl_attachment/");
    }
    return isRelative ? `${url.pathname}${url.search}${url.hash}` : url.toString();
  } catch {
    return value;
  }
}

export default function PublicationsEditor() {
  const [page, setPage] = useState(1);
  const [books, setBooks] = useState<Book[]>([]);
  const [editing, setEditing] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);
  const query = useCmsCollection<Book[]>("publications");
  const saveCollection = useSaveCmsCollection<Book[]>("publications", () => serverRevision.current);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(books.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const offset = (activePage - 1) * pageSize;
  const visibleBooks = books.slice(offset, offset + pageSize);

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const draft = JSON.stringify(books);
    if (serverSnapshot.current === null) { setBooks(query.data); serverSnapshot.current = incoming; serverRevision.current = query.revision ?? null; }
    else if (draft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) { setBooks(query.data); serverSnapshot.current = incoming; }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, books]);

  async function save() {
    setSaving(true); setMessage("");
    try { const saved = await saveCollection.mutateAsync(books); serverSnapshot.current = JSON.stringify(books); serverRevision.current = saved.revision; setMessage("Saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save publications."); }
    finally { setSaving(false); }
  }

  async function deletePublication(id: number) {
    if (saving) return false;
    const nextBooks = books.filter((book) => book.id !== id);
    setSaving(true); setMessage("");
    try {
      const saved = await saveCollection.mutateAsync(nextBooks);
      setBooks(nextBooks);
      serverSnapshot.current = JSON.stringify(nextBooks);
      serverRevision.current = saved.revision;
      setMessage("Publication deleted.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete this publication.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function editPublication(book: Book) {
    const generated = createSeoMetadata(book.title, book.description);
    setEditing({
      ...book,
      slug: book.slug?.trim() || generated.slug,
      seoTitle: book.seoTitle?.trim() || generated.seoTitle,
      seoDescription: book.seoDescription?.trim() || generated.seoDescription,
    });
  }

  function updatePublicationTitle(title: string) {
    setEditing((current) => {
      if (!current) return current;
      const previousGenerated = createSeoMetadata(current.title, current.description);
      const nextGenerated = createSeoMetadata(title, current.description);
      return {
        ...current,
        title,
        slug: !current.slug || current.slug === previousGenerated.slug ? nextGenerated.slug : current.slug,
        seoTitle: !current.seoTitle || current.seoTitle === previousGenerated.seoTitle ? nextGenerated.seoTitle : current.seoTitle,
      };
    });
  }

  function updatePublicationDescription(description: string) {
    setEditing((current) => {
      if (!current) return current;
      const previousGenerated = createSeoMetadata(current.title, current.description);
      const nextGenerated = createSeoMetadata(current.title, description);
      return {
        ...current,
        description,
        seoDescription: !current.seoDescription || current.seoDescription === previousGenerated.seoDescription
          ? nextGenerated.seoDescription
          : current.seoDescription,
      };
    });
  }

  function applyPublication() {
    if (!editing) return;
    const generated = createSeoMetadata(editing.title, editing.description);
    const publication = {
      ...editing,
      slug: editing.slug?.trim() || generated.slug,
      seoTitle: editing.seoTitle?.trim() || generated.seoTitle,
      seoDescription: editing.seoDescription?.trim() || generated.seoDescription,
    };
    setBooks((previous) => previous.some((book) => book.id === publication.id)
      ? previous.map((book) => book.id === publication.id ? publication : book)
      : [...previous, publication]);
    setEditing(null);
  }

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-500">{books.length} publications</p>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">{message && <span role="status" className="text-sm font-bold">{message}</span>}
        <button
          onClick={() => setEditing({ ...EMPTY, id: Date.now(), number: String(books.length + 1).padStart(2, "0"), url: "" })}
          className="cursor-pointer bg-[#f2e9da] px-4 py-2 text-sm font-bold text-[#5C3317] shadow-xs transition-all duration-150 ease-out hover:bg-[#ebdcc7] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        >
          New publication
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="cursor-pointer bg-[#5C3317] px-4 py-2 text-sm font-black text-white shadow-xs transition-all duration-150 ease-out hover:bg-[#482812] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
    {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading publications…</p>}
    {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
    <div className="grid grid-cols-1 gap-4 min-[540px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-6">{visibleBooks.map((book, pageIndex) => <article key={book.id} className="relative overflow-hidden border border-gray-100 bg-white shadow-sm">
      <span className="absolute right-2 top-2 z-10 grid size-6 place-items-center border border-white/70 bg-[#3e2009]/85 text-[10px] font-bold tabular-nums text-white">{offset + pageIndex + 1}</span>
      {book.coverImage ? (
        <div className="relative h-44 w-full bg-gray-100">
          <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">PSF / {book.number}</p>
            <p className="line-clamp-2 text-xs font-bold text-white">{book.title}</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-44 flex-col justify-between gap-3 p-4" style={{ background: book.color ?? COLORS[0] }}><p className="text-xs uppercase tracking-widest" style={{ color: book.subtitleColor ?? "#C9952A" }}>PSF / {book.number}</p><p className="line-clamp-3 text-sm font-bold leading-5" style={{ color: book.titleColor ?? "#ffffff" }}>{book.title}</p><p className="text-xs font-medium uppercase leading-5 tracking-wider" style={{ color: book.subtitleColor ?? "#C9952A" }}>{book.subtitle}</p></div>
      )}
      <div className="flex flex-wrap items-center gap-2 p-3">
        <Button type="button" variant="outline" size="sm" onClick={() => editPublication(book)}>Edit</Button>
        {book.url && (
          <Button nativeButton={false} render={<a href={getDownloadUrl(book.url)} download target="_blank" rel="noopener noreferrer" />} type="button" variant="outline" size="sm">
            <Download data-icon="inline-start" />Download
          </Button>
        )}
        <ConfirmDeleteAction
          title="Are you sure?"
          description={`You are about to delete the publication “${book.title}”. This action cannot be undone.`}
          confirmLabel="Delete"
          disabled={saving}
          onConfirm={() => deletePublication(book.id)}
        >Delete</ConfirmDeleteAction>
      </div>
    </article>)}</div>
    <PaginationControls page={activePage} totalPages={totalPages} totalItems={books.length} pageSize={pageSize} itemLabel="publications" lang="en" onPageChange={setPage} />
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4"><div className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain bg-white p-4 shadow-2xl sm:p-6">
      <h2 className="mb-4 text-lg font-black">Publication details</h2>
      {(["number", "title", "subtitle", "description"] as const).map((field) => <label key={field} className="mb-3 block text-xs font-bold capitalize text-gray-500">{field}<input value={editing[field] ?? ""} onChange={(event) => {
        const value = event.target.value;
        if (field === "title") updatePublicationTitle(value);
        else if (field === "description") updatePublicationDescription(value);
        else setEditing({ ...editing, [field]: value });
      }} className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>)}
      
      <div className="mb-4">
        <label className="mb-1 block text-xs font-bold text-gray-500">Cover image (optional)</label>
        <div className="flex items-center gap-3">
          {editing.coverImage && (
            <img src={editing.coverImage} alt="Cover preview" className="h-16 w-12 border border-gray-200 object-cover" />
          )}
          <CloudinaryMediaPicker
            label={editing.coverImage ? "Change cover image" : "Choose cover image"}
            resourceType="image"
            onSelect={(asset) => setEditing({ ...editing, coverImage: asset.secureUrl || asset.url })}
          />
          {editing.coverImage && (
            <button
              type="button"
              onClick={() => setEditing({ ...editing, coverImage: "" })}
              className="text-xs text-red-600 underline hover:text-red-800"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-bold text-gray-500">Document attachment</label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setEditing({ ...editing, fileType: "pdf" })}
              className={`px-2 py-0.5 font-bold cursor-pointer ${editing.fileType !== "image" ? "bg-[#5C3317] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => setEditing({ ...editing, fileType: "image" })}
              className={`px-2 py-0.5 font-bold cursor-pointer ${editing.fileType === "image" ? "bg-[#5C3317] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Image
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {editing.fileType === "image" ? (
            <CloudinaryMediaPicker
              label={editing.url ? "Change document image" : "Upload document image"}
              resourceType="image"
              onSelect={(asset) => setEditing({ ...editing, url: asset.secureUrl || asset.url, fileType: "image" })}
            />
          ) : (
            <CloudinaryMediaPicker
              label={editing.url ? "Change PDF document" : "Select PDF document"}
              resourceType="raw"
              onSelect={(asset) => setEditing({ ...editing, url: asset.secureUrl || asset.url, fileType: "pdf" })}
            />
          )}
          {editing.url && (
            <span className="truncate text-xs text-gray-500 max-w-[160px]" title={editing.url}>
              {editing.url.split("/").pop()}
            </span>
          )}
        </div>
      </div>

      {!editing.coverImage && (
        <div className="mb-4">
          <span className="mb-1 block text-xs font-bold text-gray-500">Fallback cover color</span>
          <div className="flex flex-wrap gap-2">{COLORS.map((color) => <button key={color} type="button" onClick={() => setEditing({ ...editing, color })} aria-label={`Cover color ${color}`} className="h-8 w-8 cursor-pointer border-2 transition-all duration-150 ease-out hover:scale-110 active:scale-95" style={{ background: color, borderColor: editing.color === color ? "#C9952A" : "transparent" }} />)}</div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <button onClick={() => setEditing(null)} className="cursor-pointer bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-150 ease-out hover:bg-gray-200 active:scale-95">Cancel</button>
        <button onClick={applyPublication} className="cursor-pointer bg-[#5C3317] px-4 py-2 text-sm font-black text-white shadow-xs transition-all duration-150 ease-out hover:bg-[#482812] hover:shadow-md active:scale-95">Apply</button>
      </div>
    </div></div>}
  </div>;
}
