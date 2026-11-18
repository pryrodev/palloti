"use client";

import { useEffect, useRef, useState } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import PaginationControls from "@/components/ui/PaginationControls";

type Book = { id: number; slug?: string; number: string; title: string; seoTitle?: string; seoDescription?: string; subtitle: string; description: string; color: string; titleColor: string; subtitleColor: string; url: string };
const COLORS = ["#5C3317", "#3A1F0A", "#7A4520", "#C9952A", "#2C4A1E", "#1A3A5C", "#4A2060", "#1A4A3A"];
const EMPTY: Omit<Book, "id" | "number" | "url"> = { slug: "", title: "", seoTitle: "", seoDescription: "", subtitle: "Document", description: "", color: COLORS[0], titleColor: "#ffffff", subtitleColor: "#C9952A" };

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

  function addPublication(url: string, name: string) {
    const book: Book = { ...EMPTY, id: Date.now(), number: String(books.length + 1).padStart(2, "0"), title: name, url };
    setBooks((previous) => [...previous, book]); setEditing(book);
  }

  return <div>
    <div className="mb-6 flex items-center justify-between gap-3">
      <p className="text-sm text-gray-500">{books.length} publications</p>
      <div className="flex items-center gap-3">{message && <span role="status" className="text-sm font-bold">{message}</span>}
        <CloudinaryMediaPicker label="+ Add document" resourceType="raw" onSelect={(asset) => addPublication(asset.secureUrl, asset.publicId.split("/").pop() ?? "New document")} />
        <button onClick={() => setEditing({ ...EMPTY, id: Date.now(), number: String(books.length + 1).padStart(2, "0"), url: "" })} className=" bg-[#f2e9da] px-4 py-2 text-sm font-bold text-[#5C3317]">New publication</button>
        <button onClick={save} disabled={saving} className=" bg-[#5C3317] px-4 py-2 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
    {query.isLoading && <p className="mb-4 text-sm text-gray-500">Loading publications…</p>}
    {query.error && <p role="alert" className="mb-4 text-sm text-red-700">{query.error.message}</p>}
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">{visibleBooks.map((book, pageIndex) => <article key={book.id} className="relative overflow-hidden border border-gray-100 bg-white shadow-sm">
      <span className="absolute right-2 top-2 z-10 grid size-6 place-items-center border border-white/70 bg-[#3e2009]/85 text-[10px] font-bold tabular-nums text-white">{offset + pageIndex + 1}</span>
      <div className="flex h-32 flex-col justify-between p-3" style={{ background: book.color }}><p className="text-[7px] uppercase tracking-widest" style={{ color: book.titleColor }}>PSF / {book.number}</p><p className="text-[10px] font-black" style={{ color: book.titleColor }}>{book.title}</p><p className="text-[7px] uppercase tracking-widest" style={{ color: book.subtitleColor }}>{book.subtitle}</p></div>
      <div className="flex gap-2 p-3"><button onClick={() => setEditing(book)} className="flex-1  bg-gray-100 py-1.5 text-xs font-bold">Edit</button><button onClick={() => setBooks((previous) => previous.filter((entry) => entry.id !== book.id))} className="flex-1  bg-red-50 py-1.5 text-xs font-bold text-red-600">Remove</button></div>
    </article>)}</div>
    <PaginationControls page={activePage} totalPages={totalPages} totalItems={books.length} pageSize={pageSize} itemLabel="publications" lang="en" onPageChange={setPage} />
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-md overflow-y-auto  bg-white p-6 shadow-2xl">
      <h2 className="mb-4 text-lg font-black">Publication details</h2>
      {(["number", "title", "slug", "seoTitle", "seoDescription", "subtitle", "description"] as const).map((field) => <label key={field} className="mb-3 block text-xs font-bold capitalize text-gray-500">{field}<input value={editing[field] ?? ""} onChange={(event) => setEditing({ ...editing, [field]: event.target.value })} className="mt-1 w-full  border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>)}
      <div className="mb-4 flex items-center gap-3"><span className="text-xs font-bold text-gray-500">PDF/document</span><CloudinaryMediaPicker label="Choose from media" resourceType="raw" onSelect={(asset) => setEditing({ ...editing, url: asset.secureUrl })} /></div>
      <div className="mb-4 flex flex-wrap gap-2">{COLORS.map((color) => <button key={color} onClick={() => setEditing({ ...editing, color })} aria-label={`Cover color ${color}`} className="h-8 w-8  border-2" style={{ background: color, borderColor: editing.color === color ? "#C9952A" : "transparent" }} />)}</div>
      <div className="flex justify-end gap-3"><button onClick={() => setEditing(null)} className=" bg-gray-100 px-4 py-2 text-sm font-bold">Cancel</button><button onClick={() => { setBooks((previous) => previous.some((book) => book.id === editing.id) ? previous.map((book) => book.id === editing.id ? editing : book) : [...previous, editing]); setEditing(null); }} className=" bg-[#5C3317] px-4 py-2 text-sm font-black text-white">Apply</button></div>
    </div></div>}
  </div>;
}
