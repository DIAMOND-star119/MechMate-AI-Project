"use client";

import { useState } from "react";

export function AskDrawer({ subtopicId, formulaId }: { subtopicId: string; formulaId?: string }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<{ text: string; source: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!q.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim(), subtopicId, formulaId })
      });
      setAnswer(await res.json());
    } catch {
      setAnswer({ text: "Could not reach the tutor. Try again.", source: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          aria-label="Ask a question"
          placeholder="e.g. Why is horizontal acceleration zero?"
        />
        <button
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          onClick={ask}
          disabled={busy || !q.trim()}
        >
          {busy ? "…" : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="mt-2 border-l-[3px] border-indigo-600 pl-3" aria-live="polite">
          <p className="whitespace-pre-line text-sm">{answer.text}</p>
          <p className="mt-1 text-xs text-slate-500">
            {answer.source === "live" ? "Live explanation" : "Curated answer (install the model for richer explanations)"}
          </p>
        </div>
      )}
    </div>
  );
}
