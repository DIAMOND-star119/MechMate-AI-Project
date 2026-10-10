"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Meta {
  topic: string | null;
  origin: string;
  validationStatus: string;
  sources: { title: string; url: string; tier: number }[];
}

export function TopicExtras({ subtopic }: { subtopic: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    fetch(`/api/learn-meta?subtopic=${encodeURIComponent(subtopic)}`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta({ topic: null, origin: "curated", validationStatus: "validated", sources: [] }));
  }, [subtopic]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">Study Mode</span>
        <Link className="rounded-full border px-3 py-1 text-xs text-indigo-700" href={`/companion?topic=${encodeURIComponent(subtopic)}`}>
          Switch to AI Study Mode →
        </Link>
        {meta && meta.origin === "ai" && meta.validationStatus === "unvalidated" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Unvalidated — not counted toward completion</span>
        )}
      </div>
      {meta && meta.sources.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-bold text-slate-500">Sources (tier-tagged)</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {meta.sources.map((s) => (
              <li key={s.url}>
                <a className="text-indigo-700 underline" href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                <span className="ml-1 text-slate-500">· Tier {s.tier}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
