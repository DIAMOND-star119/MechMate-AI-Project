"use client";

import { useEffect, useState } from "react";

// Optional personalization (PRD §16): field + academic level. Never blocks.
export function OnboardingForm() {
  const [field, setField] = useState("");
  const [level, setLevel] = useState("");
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.field || d.level) setHidden(true);
    }).catch(() => setHidden(true));
  }, []);

  if (hidden) return null;

  async function save() {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: field || null, level: level || null })
    }).catch(() => {});
    setSaved(true);
  }

  return (
    <section className="mm-card">
      <div className="mm-eyebrow">Optional — improve recommendations</div>
      {saved ? (
        <p className="text-sm text-emerald-700">Saved. You can change this anytime.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Field (e.g. Physics)"
            value={field} onChange={(e) => setField(e.target.value)} aria-label="Field of study" />
          <input className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Level (e.g. Year 2)"
            value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Academic level" />
          <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" onClick={save}>Save</button>
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setHidden(true)}>Skip</button>
        </div>
      )}
    </section>
  );
}
