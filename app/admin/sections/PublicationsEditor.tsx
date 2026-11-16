"use client";

import { useState, useEffect, useRef } from "react";

type Book = {
  id: number; number: string; title: string; subtitle: string;
  description: string; color: string; titleColor: string; subtitleColor: string; url?: string;
};

const COLORS = ["#5C3317","#3A1F0A","#7A4520","#C9952A","#2C4A1E","#1A3A5C","#4A2060","#1A4A3A"];

export default function PublicationsEditor() {
  const [books, setBooks] = useState<Book[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Book | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/publications", { credentials: "include" })
      .then((r) => r.json()).then(setBooks);
  }, []);

  async function uploadPdf(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "pdf");
    const res = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: fd });
    const { url } = await res.json();
    const newBook: Book = {
      id: Date.now(),
      number: String(books.length + 1).padStart(2, "0"),
      title: file.name.replace(/\.pdf$/i, ""),
      subtitle: "Document",
      description: "",
      color: COLORS[books.length % COLORS.length],
      titleColor: "#ffffff",
      subtitleColor: "#C9952A",
      url,
    };
    setBooks((prev) => [...prev, newBook]);
    setEditing(newBook);
    setUploading(false);
  }

  function remove(id: number) {
    if (!confirm("Remove this publication?")) return;
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/publications", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(books),
    });
    setMsg(res.ok ? "✅ Saved!" : "❌ Error");
    setSaving(false);
  }

  function saveEditing() {
    if (!editing) return;
    setBooks((prev) => prev.map((b) => b.id === editing.id ? editing : b));
    setEditing(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{books.length} publication{books.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadPdf(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#C9952A", color: "#3e2009" }}>
            {uploading ? "Uploading…" : "+ Upload PDF"}
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <div key={book.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* Mini cover preview */}
            <div className="h-32 flex flex-col justify-between p-3 relative"
              style={{ background: book.color }}>
              <p style={{ color: book.titleColor, fontSize: "7px", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                PSF / {book.number}
              </p>
              <p style={{ color: book.titleColor, fontSize: "10px", fontWeight: 900, lineHeight: 1.3, fontFamily: "Georgia, serif" }}>
                {book.title}
              </p>
              <p style={{ color: book.subtitleColor, fontSize: "7px", opacity: 0.8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {book.subtitle}
              </p>
            </div>
            <div className="p-3 flex gap-2">
              <button onClick={() => setEditing(book)}
                className="flex-1 py-1.5 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200">Edit</button>
              <button onClick={() => remove(book.id)}
                className="flex-1 py-1.5 text-xs font-bold rounded bg-red-50 text-red-600 hover:bg-red-100">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-black text-lg mb-4">Edit Publication</h2>
            {[
              { key: "number", label: "Number" },
              { key: "title", label: "Title" },
              { key: "subtitle", label: "Subtitle" },
              { key: "description", label: "Description" },
            ].map(({ key, label }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                <input value={(editing as unknown as Record<string, string>)[key]}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A]" />
              </div>
            ))}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cover Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setEditing({ ...editing, color: c })}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ background: c, borderColor: editing.color === c ? "#C9952A" : "transparent" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={saveEditing}
                className="px-4 py-2 text-sm font-black rounded-lg text-white"
                style={{ background: "#5C3317" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
