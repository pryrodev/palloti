"use client";

import { useState, useEffect } from "react";

type Member = { name: string; role: string; image: string };

export default function DirectionEditor() {
  const [enMembers, setEnMembers] = useState<Member[]>([]);
  const [frMembers, setFrMembers] = useState<Member[]>([]);
  const [lang, setLang] = useState<"en"|"fr">("en");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const members = lang === "en" ? enMembers : frMembers;
  const setMembers = lang === "en" ? setEnMembers : setFrMembers;

  useEffect(() => {
    fetch("/api/admin/direction", { credentials: "include" })
      .then((r) => r.json())
      .then(({ en, fr }) => { setEnMembers(en); setFrMembers(fr); });
  }, []);

  function update(idx: number, field: keyof Member, value: string) {
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/direction", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ en: enMembers, fr: frMembers }),
    });
    setMsg(res.ok ? "✅ Saved!" : "❌ Error");
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(["en","fr"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ background: lang === l ? "#5C3317" : "#e8e2d9", color: lang === l ? "#C9952A" : "#5C3317" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-sm font-bold">{msg}</span>}
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-black disabled:opacity-50"
            style={{ background: "#5C3317", color: "#fff" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {members.map((m, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.image && <img src={m.image} alt={m.name} className="w-full h-full object-cover object-top" />}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Name</label>
                <input value={m.name} onChange={(e) => update(idx, "name", e.target.value)}
                  className="w-full text-sm font-bold border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C9952A]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Role</label>
                <input value={m.role} onChange={(e) => update(idx, "role", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C9952A]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Image path</label>
                <input value={m.image} onChange={(e) => update(idx, "image", e.target.value)}
                  className="w-full text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C9952A]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
