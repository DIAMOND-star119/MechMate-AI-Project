"use client";

import { useState } from "react";
import Link from "next/link";
import { searchSubtopics } from "../lib/content";

export function SearchBox() {
  const [q, setQ] = useState("Kinematics");
  const results = searchSubtopics(q);
  return (
    <section className="mm-card">
      <div className="mm-eyebrow">PRD §6 — Topic discovery</div>
      <h2 className="text-lg font-bold">Search → Subtopics</h2>
      <input
        className="mt-3 w-full rounded-full border border-slate-200 px-4 py-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search topics"
        placeholder="Try Kinematics, Velocity…"
      />
      <ul className="mt-3 space-y-2 text-sm">
        {results.map((r) => (
          <li key={r.subtopic} className="rounded-lg border p-2.5">
            <Link className="font-bold text-indigo-700 underline" href={`/learn/${r.subtopic.toLowerCase()}`}>
              {r.subtopic}
            </Link>
            <span className="text-slate-500"> — {r.topic} · {r.subject}</span>
          </li>
        ))}
        {results.length === 0 && <li className="text-sm text-slate-500">No matches yet — more subtopics land after this slice.</li>}
      </ul>
      <p className="mt-3 rounded-lg bg-amber-100 p-2.5 text-[13px] text-amber-900">
        ⚠ Projectile motion uses Velocity components. You can continue — quick refresh available in context.
      </p>
    </section>
  );
}
