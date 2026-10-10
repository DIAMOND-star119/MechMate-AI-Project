"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TopicRow {
  topic: string;
  subject: string;
  totalSubtopics: number;
  percent: number;
  sections: { title: string; kind: string; covered: boolean }[];
  completed: boolean;
  mastered: boolean;
  attempts: number;
  struggling: string[];
  started: boolean;
  continueHref: string | null;
}

function Bar({ percent }: { percent: number }) {
  const blocks = Math.round(percent / 10);
  return (
    <span className="font-mono text-sm tracking-tight" aria-label={`${percent}% complete`}>
      {"█".repeat(blocks)}{"░".repeat(10 - blocks)} {percent}%
    </span>
  );
}

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(() => setData({ error: true }));
  }, []);

  if (!data) return <section className="mm-card"><p className="text-sm text-slate-500" role="status">Loading your progress…</p></section>;
  if (data.error) return <section className="mm-card"><p className="text-sm text-slate-500">Progress unavailable right now.</p></section>;

  if (!data.signedIn) {
    return (
      <section className="mm-card">
        <div className="mm-eyebrow">Your learning — sign in to track progress</div>
        <h2 className="text-lg font-bold">Available topics</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {data.catalogue.map((c: any) => (
            <li key={c.topic} className="rounded-lg border p-2.5">
              <b>{c.topic}</b> <span className="text-slate-500">· {c.subject}</span><br />
              <span className="text-slate-600">{c.subtopics.join(" · ")}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-slate-600">Continue as guest above to start tracking your progress.</p>
      </section>
    );
  }

  return (
    <section className="mm-card">
      <div className="mm-eyebrow">Dashboard — what you&apos;ve covered, what remains</div>
      <h2 className="text-lg font-bold">Overall progress</h2>
      <p className="mt-1"><Bar percent={data.overall} /></p>
      <div className="mt-4 space-y-3">
        {data.topics.map((t: TopicRow) => (
          <div key={t.topic} className="rounded-lg border p-2.5">
            <p className="text-sm"><b>{t.topic}</b> <span className="text-slate-500">· {t.subject}</span>
              {t.mastered && <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">Mastered</span>}
              {!t.mastered && t.completed && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">Completed</span>}
            </p>
            <p className="mt-1"><Bar percent={t.percent} /></p>
            <details className="mt-1 text-sm">
              <summary className="cursor-pointer text-xs text-slate-500">
                {t.sections.filter((s) => s.covered).length}/{t.sections.length} sections
                {t.struggling.length > 0 && <> · needs work: {t.struggling.join(", ")}</>}
              </summary>
              <ul className="mt-1 space-y-0.5 text-slate-600">
                {t.sections.map((s) => (
                  <li key={s.title}>{s.covered ? "✓" : "○"} {s.title}</li>
                ))}
              </ul>
            </details>
            {t.continueHref && <Link className="text-sm text-indigo-700 underline" href={t.continueHref}>Continue →</Link>}
          </div>
        ))}
      </div>
      {data.recent?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold">Recently studied</h3>
          <ul className="mt-1 space-y-1 text-sm text-slate-600">
            {data.recent.map((r: any, i: number) => (
              <li key={i}>{r.correct ? "✓" : "✗"} {r.subtopic} ({r.topic})</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-sm text-slate-600">{data.remaining} section{data.remaining === 1 ? "" : "s"} remaining before current topics are complete. Mastery needs consistent practice performance.</p>
    </section>
  );
}
