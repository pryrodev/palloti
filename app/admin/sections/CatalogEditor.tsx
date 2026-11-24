"use client";

import { useState } from "react";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import { Button } from "@/components/ui/button";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";

type Father = { name: string; role?: string; image?: string; biography?: string; birthYear?: string; deathYear?: string; lifeStatus?: "living" | "deceased" | "unknown"; __index?: number };

export default function CatalogEditor() {
  const query = useCmsCollection<Father[]>("catalog");
  const save = useSaveCmsCollection<Father[]>("catalog", () => query.revision ?? null);
  const [draft, setDraft] = useState<Father | null>(null);
  const [message, setMessage] = useState("");
  const fathers = query.data ?? [];
  async function persist(next: Father[]) {
    try { await save.mutateAsync(next.map(({__index, ...father}) => father)); setDraft(null); setMessage("Catalog saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save catalog."); }
  }
  return <section className="mx-auto flex max-w-4xl flex-col gap-5">
    <p className="text-sm text-muted-foreground">Historical catalog of all fathers, independent from the current Provincial Direction.</p>
    {query.error && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    {draft ? <div className="grid gap-3 border border-border bg-white p-4 sm:grid-cols-2">
      <label className="text-xs font-semibold">Name<input value={draft.name} onChange={e => setDraft({...draft, name:e.target.value})} className="mt-1 w-full border p-2 text-sm" /></label>
      <label className="text-xs font-semibold">Role or title<input value={draft.role ?? ""} onChange={e => setDraft({...draft, role:e.target.value})} className="mt-1 w-full border p-2 text-sm" /></label>
      <label className="text-xs font-semibold">Birth year<input inputMode="numeric" maxLength={4} value={draft.birthYear ?? ""} onChange={e => setDraft({...draft, birthYear:e.target.value.replace(/\D/g, "").slice(0,4)})} className="mt-1 w-full border p-2 text-sm" /></label>
      <label className="text-xs font-semibold">Death year<input inputMode="numeric" maxLength={4} value={draft.deathYear ?? ""} onChange={e => setDraft({...draft, deathYear:e.target.value.replace(/\D/g, "").slice(0,4), lifeStatus:e.target.value ? "deceased" : draft.lifeStatus})} className="mt-1 w-full border p-2 text-sm" /></label>
      <label className="text-xs font-semibold">Life status<select value={draft.lifeStatus ?? "unknown"} onChange={e => setDraft({...draft, lifeStatus:e.target.value as Father["lifeStatus"], deathYear:e.target.value === "living" ? "" : draft.deathYear})} className="mt-1 w-full border p-2 text-sm"><option value="unknown">Not specified</option><option value="living">Living</option><option value="deceased">Deceased</option></select></label>
      <div className="flex items-end"><CloudinaryMediaPicker label={draft.image ? "Change portrait" : "Add portrait"} resourceType="image" onSelect={asset => setDraft({...draft, image:asset.secureUrl})} /></div>
      <label className="text-xs font-semibold sm:col-span-2">Biography<textarea rows={4} value={draft.biography ?? ""} onChange={e => setDraft({...draft, biography:e.target.value})} className="mt-1 w-full border p-2 text-sm" /></label>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={save.isPending || !draft.name.trim()} onClick={() => void persist(draft.__index === undefined ? [...fathers, draft] : fathers.map((f, i) => i === draft.__index ? draft : f))}>Save father</Button><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button></div>
    </div> : <Button onClick={() => setDraft({name:"", lifeStatus:"unknown"})}>Add father</Button>}
    <ol className="divide-y border bg-white">{fathers.map((father, i) => <li key={`${father.name}-${i}`} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><p className="font-semibold">{father.name}</p><p className="text-xs text-muted-foreground">{father.birthYear ?? "?"} – {father.lifeStatus === "living" ? "Present" : father.deathYear ?? "?"} · {father.lifeStatus ?? "Not specified"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setDraft(Object.assign({}, father, {__index:i}))}>Edit</Button><Button size="sm" variant="outline" onClick={() => void persist(fathers.filter((_, index) => index !== i))}>Delete</Button></div></li>)}</ol>
  </section>;
}
