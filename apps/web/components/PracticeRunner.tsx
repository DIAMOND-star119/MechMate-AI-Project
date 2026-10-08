"use client";

import { useMemo, useState } from "react";
import { Math } from "./Math";
import { sortByDifficulty, nextLevel, summarize, correctionLine, type PracticeItem, type AttemptResult } from "../lib/practice";
import { track } from "../lib/analytics";

export function PracticeRunner({ items, subtopic }: { items: PracticeItem[]; subtopic: string }) {
  const ordered = useMemo(() => sortByDifficulty(items), [items]);
  const maxLevel = useMemo(() => globalThis.Math.max(...ordered.map((q) => q.difficulty)), [ordered]);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [askedIds, setAskedIds] = useState<string[]>([ordered[0]?.id].filter(Boolean) as string[]);
  const [given, setGiven] = useState("");
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [retest, setRetest] = useState(false);

  const current = ordered.find((q) => q.id === askedIds[askedIds.length - 1]);
  const done = results.length >= ordered.length && !retest;
  const summary = summarize(results);

  function normalize(s: string) {
    return s.trim().toLowerCase();
  }

  function submit() {
    if (!current || !given.trim()) return;
    const correct = normalize(given) === normalize(current.answer);
    const r: AttemptResult = { id: current.id, correct, prerequisites: current.prerequisites, answer: current.answer, given: given.trim() };
    const next = [...results, r];
    setResults(next);
    const ns = correct ? streak + 1 : 0;
    setStreak(ns);
    setLevel(nextLevel(level, ns, correct, maxLevel));
    setGiven("");
    const remaining = ordered.filter((q) => !next.some((x) => x.id === q.id) && !askedIds.includes(q.id));
    const pool = remaining.filter((q) => q.difficulty === nextLevel(level, ns, correct, maxLevel));
    const nxt = (pool[0] ?? remaining[0]);
    if (nxt) setAskedIds([...askedIds, nxt.id]);
    if (next.length >= ordered.length && !retest) {
      const s = summarize(next);
      track({ name: "practice_complete", subtopic, score: s.score, total: s.total });
      if (s.missed.length === 0) track({ name: "retest_pass", subtopic });
    }
  }

  function startRetest() {
    const missedIds = summary.missed.map((m) => m.id);
    setResults([]);
    setAskedIds(missedIds.length ? [missedIds[0]] : []);
    setStreak(0);
    setLevel(1);
    setRetest(true);
  }

  if (ordered.length === 0) return <p className="text-sm text-slate-500">No practice questions yet for this subtopic.</p>;

  if (done) {
    return (
      <div aria-live="polite">
        <p><b>{summary.score} / {summary.total} correct</b> <span className="text-xs text-slate-500">(played at level {level})</span></p>
        {summary.missed.map((m) => (
          <p key={m.id} className="mt-2 text-sm">❌ {correctionLine(m)}</p>
        ))}
        {summary.strengths.length > 0 && (
          <p className="mt-2 rounded-lg bg-emerald-100 p-2 text-sm text-emerald-900">✓ Strengths: {summary.strengths.join(", ")}</p>
        )}
        {summary.missed.length > 0 ? (
          <button className="mt-3 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" onClick={startRetest}>
            Clearer explanation → Retest missed
          </button>
        ) : (
          <p className="mt-2 text-sm text-emerald-700">Clean sweep — ready for the next subtopic.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Difficulty {current?.difficulty} / {maxLevel} · streak {streak}</p>
      <p className="mt-1 text-[15px]"><b>Q{results.length + 1}.</b> {current?.prompt}</p>
      <div className="mt-2 flex gap-2">
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          value={given}
          onChange={(e) => setGiven(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          aria-label="Your answer"
          placeholder="e.g. 17.3 m/s"
        />
        <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" onClick={submit}>Check</button>
      </div>
      {retest && <p className="mt-2 text-xs text-slate-500">Retest mode: same concepts, fresh attempt after the correction above.</p>}
    </div>
  );
}
