"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Weakest-first over subtopics that ACTUALLY exist (from the catalogue).
// Dead links are impossible: only real subtopics are ever linked.
export function NextUp() {
  const [names, setNames] = useState<string[]>(["Velocity"]);
  const [statusByName, setStatusByName] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const cat = (d.catalogue ?? []) as { subtopics: string[] }[];
        const all = cat.flatMap((c) => c.subtopics);
        if (all.length) setNames(all);
      })
      .catch(() => {});
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        for (const p of (d.progress ?? []) as { status: string; subtopic: string }[]) map[p.subtopic] = p.status;
        setStatusByName(map);
      })
      .catch(() => {});
  }, []);
  const ranked = [...names].sort((a, b) => {
    const rank = (s?: string) => (s === "struggling" ? 0 : s === undefined ? 1 : 2);
    return rank(statusByName[a]) - rank(statusByName[b]);
  });
  return (
    <div>
      <p><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">Next: {ranked[0]} →</span></p>
      <ul className="mt-2 space-y-1 text-sm">
        {ranked.map((n) => (
          <li key={n}>
            <Link className="text-indigo-700 underline" href={`/learn/${n.toLowerCase()}`}>{n}</Link>
            {statusByName[n] && <span className="ml-2 text-xs text-slate-500">{statusByName[n]}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-slate-500">Recommendations guide — explore freely.</p>
    </div>
  );
}
