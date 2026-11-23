"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ImageOff, Pencil, Plus, Trash2, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { useCmsCollection, useSaveCmsCollection } from "@/lib/useCmsCollection";
import CloudinaryMediaPicker from "./CloudinaryMediaPicker";
import DataTable from "../components/DataTable";
import ConfirmDeleteAction from "../components/ConfirmDeleteAction";

type Member = { name: string; role: string; image?: string };
type DirectionPayload = { en: Member[]; fr: Member[] };
type Locale = "en" | "fr";

export default function DirectionEditor() {
  const [enMembers, setEnMembers] = useState<Member[]>([]);
  const [frMembers, setFrMembers] = useState<Member[]>([]);
  const [lang, setLang] = useState<Locale>("en");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const savingLock = useRef(false);
  const serverSnapshot = useRef<string | null>(null);
  const serverRevision = useRef<number | null>(null);

  const members = lang === "en" ? enMembers : frMembers;
  const query = useCmsCollection<DirectionPayload>("direction");
  const saveCollection = useSaveCmsCollection<DirectionPayload>("direction", () => serverRevision.current);

  useEffect(() => {
    if (!query.data) return;
    const incoming = JSON.stringify(query.data);
    const currentDraft = JSON.stringify({ en: enMembers, fr: frMembers });
    if (serverSnapshot.current === null) {
      setEnMembers(query.data.en);
      setFrMembers(query.data.fr);
      serverSnapshot.current = incoming;
      serverRevision.current = query.revision ?? null;
    } else if (currentDraft === serverSnapshot.current) {
      if (incoming !== serverSnapshot.current) {
        setEnMembers(query.data.en);
        setFrMembers(query.data.fr);
        serverSnapshot.current = incoming;
      }
      serverRevision.current = query.revision ?? serverRevision.current;
    }
  }, [query.data, query.revision, enMembers, frMembers]);

  const editRow = useCallback((index: number, member: Member) => {
    setMessage("");
    setEditingIndex(index);
    setEditingMember({ ...member });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingMember(null);
    setMessage("");
  }, []);

  const saveRow = useCallback(async (index: number) => {
    if (!editingMember || savingLock.current || savingIndex !== null) return;
    savingLock.current = true;
    setSavingIndex(index);
    setMessage("");

    const payload: DirectionPayload = {
      en: lang === "en" ? enMembers.map((member, rowIndex) => rowIndex === index ? editingMember : member) : enMembers,
      fr: lang === "fr" ? frMembers.map((member, rowIndex) => rowIndex === index ? editingMember : member) : frMembers,
    };

    try {
      const saved = await saveCollection.mutateAsync(payload);
      setEnMembers(payload.en);
      setFrMembers(payload.fr);
      serverSnapshot.current = JSON.stringify(payload);
      serverRevision.current = saved.revision;
      setEditingIndex(null);
      setEditingMember(null);
      setMessage("Member saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this member.");
      void query.refetch();
    } finally {
      savingLock.current = false;
      setSavingIndex(null);
    }
  }, [editingMember, savingIndex, lang, enMembers, frMembers, saveCollection, query]);

  const addMember = useCallback(async () => {
    const newMember: Member = { name: "New Member", role: "Role", image: "" };
    const updated = [...members, newMember];
    const payload: DirectionPayload = {
      en: lang === "en" ? updated : enMembers,
      fr: lang === "fr" ? updated : frMembers,
    };
    try {
      const saved = await saveCollection.mutateAsync(payload);
      setEnMembers(payload.en);
      setFrMembers(payload.fr);
      serverSnapshot.current = JSON.stringify(payload);
      serverRevision.current = saved.revision;
      const newIndex = updated.length - 1;
      setEditingIndex(newIndex);
      setEditingMember({ ...newMember });
      setMessage("New member added. Update the details and click Save.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add member.");
    }
  }, [members, lang, enMembers, frMembers, saveCollection]);

  const deleteMember = useCallback(async (index: number) => {
    const target = members[index];
    if (!target) return;
    const updated = members.filter((_, i) => i !== index);
    const payload: DirectionPayload = {
      en: lang === "en" ? updated : enMembers,
      fr: lang === "fr" ? updated : frMembers,
    };
    try {
      const saved = await saveCollection.mutateAsync(payload);
      setEnMembers(payload.en);
      setFrMembers(payload.fr);
      serverSnapshot.current = JSON.stringify(payload);
      serverRevision.current = saved.revision;
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditingMember(null);
      }
      setMessage("Member deleted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete member.");
    }
  }, [members, lang, enMembers, frMembers, saveCollection, editingIndex]);

  const columns = useMemo<ColumnDef<DataGridFeatures, Member>[]>(() => [
    {
      id: "index",
      header: "#",
      enableSorting: false,
      size: 56,
      minSize: 56,
      maxSize: 56,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{members.indexOf(row.original) + 1}</span>,
    },
    {
      id: "image",
      header: "Image",
      enableSorting: false,
      size: 190,
      minSize: 190,
      maxSize: 190,
      cell: ({ row }) => {
        const index = members.indexOf(row.original);
        const isEditing = editingIndex === index && editingMember !== null;
        const image = isEditing ? editingMember.image : row.original.image;
        return <div className="flex items-center gap-2">
          <div className="relative size-14 shrink-0 border border-border bg-muted">
            {image ? <Image src={image} alt={row.original.name} fill unoptimized sizes="56px" className="object-cover object-top" /> : <ImageOff aria-label="No member image" className="m-auto size-4 text-muted-foreground" />}
          </div>
          {isEditing && savingIndex === null && <CloudinaryMediaPicker label="Change" resourceType="image" onSelect={(asset) => setEditingMember((current) => current ? { ...current, image: asset.secureUrl } : current)} />}
        </div>;
      },
    },
    {
      accessorKey: "name",
      size: 320,
      minSize: 260,
      header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
      cell: ({ row }) => {
        const index = members.indexOf(row.original);
        const isEditing = editingIndex === index && editingMember !== null;
        return isEditing ? <label className="block">
          <span className="sr-only">Name</span>
          <input autoFocus value={editingMember.name} disabled={savingIndex !== null} onChange={(event) => setEditingMember((current) => current ? { ...current, name: event.target.value } : current)} className="w-full min-w-0 border border-input bg-background px-2 py-1.5 text-sm font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
        </label> : <span className="break-words text-sm font-semibold text-foreground">{row.original.name}</span>;
      },
    },
    {
      accessorKey: "role",
      size: 300,
      minSize: 240,
      header: ({ column }) => <DataGridColumnHeader title="Role" column={column} />,
      cell: ({ row }) => {
        const index = members.indexOf(row.original);
        const isEditing = editingIndex === index && editingMember !== null;
        return isEditing ? <label className="block">
          <span className="sr-only">Role</span>
          <input value={editingMember.role} disabled={savingIndex !== null} onChange={(event) => setEditingMember((current) => current ? { ...current, role: event.target.value } : current)} className="w-full min-w-0 border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
        </label> : <span className="break-words text-sm text-foreground">{row.original.role}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      size: 190,
      minSize: 190,
      maxSize: 190,
      cell: ({ row }) => {
        const index = members.indexOf(row.original);
        const isEditing = editingIndex === index;
        const rowSaving = savingIndex === index;
        return isEditing ? <div className="flex items-center gap-2">
          <Button type="button" size="sm" disabled={savingIndex !== null || !editingMember?.name.trim() || !editingMember?.role.trim()} className="bg-[#5C3317] text-white hover:bg-[#70411e]" style={{ backgroundColor: "#5C3317", color: "#fff" }} onClick={() => void saveRow(index)}>
            <Check data-icon="inline-start" />{rowSaving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={savingIndex !== null} onClick={cancelEdit}>
            <X data-icon="inline-start" />Cancel
          </Button>
        </div> : <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={editingIndex !== null} onClick={() => editRow(index, row.original)}>
            <Pencil data-icon="inline-start" />Edit
          </Button>
          <ConfirmDeleteAction
            title="Delete member?"
            description={`Are you sure you want to remove “${row.original.name}”?`}
            confirmLabel="Delete"
            onConfirm={() => void deleteMember(index)}
          >
            Delete
          </ConfirmDeleteAction>
        </div>;
      },
    },
  ], [members, editingIndex, editingMember, savingIndex, saveRow, cancelEdit, editRow, deleteMember]);

  return <section className="flex flex-col gap-4">
    {query.isLoading && <p role="status" className="text-sm text-muted-foreground">Loading direction…</p>}
    {query.error && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}
    {message && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</p>}

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2" role="group" aria-label="Direction language">
        {(["en", "fr"] as const).map((locale) => <Button
          key={locale}
          type="button"
          size="sm"
          variant={lang === locale ? "default" : "outline"}
          aria-pressed={lang === locale}
          disabled={savingIndex !== null}
          onClick={() => { setLang(locale); cancelEdit(); }}
        >
          {locale.toUpperCase()}
        </Button>)}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={savingIndex !== null || editingIndex !== null}
        className="bg-[#5C3317] text-white hover:bg-[#70411e]"
        style={{ backgroundColor: "#5C3317", color: "#fff" }}
        onClick={() => void addMember()}
      >
        <Plus data-icon="inline-start" />+ Add Member
      </Button>
    </div>

    <DataTable
      columns={columns}
      data={members}
      getRowId={(member) => String(members.indexOf(member))}
      isLoading={query.isLoading}
      emptyMessage={`No ${lang === "en" ? "English" : "French"} direction members.`}
      pageSize={10}
      pageSizes={[10, 20, 50]}
    />
  </section>;
}
