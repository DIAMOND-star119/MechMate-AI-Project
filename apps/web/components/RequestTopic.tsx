"use client";

import { useState } from "react";
import Link from "next/link";

// "Teach me X" entry (brief §4): request → draft → ground → validate.
// Shows honest states: ready / unvalidated / unknown / refused.
export function RequestTopic() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);

  async function send() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/topics/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t })
      });
      setRes(await r.json());
    } catch {
      setRes({ status: "unknown", text: "Request failed. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          aria-label="Request a topic" placeholder="Teach me Bernoulli's equation…" />
        <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          onClick={send} disabled={busy || !text.trim()}>{busy ? "Building…" : "Teach me"}</button>
      </div>
      {res && (
        <div className="mt-2 text-sm" aria-live="polite">
          {(res.status === "ready" || res.status === "unvalidated") && (
            <>
              <p><b>{res.topic}</b> <span className="text-slate-500">· {res.subject}</span>
                {res.status === "unvalidated" && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Unvalidated</span>}
              </p>
              {res.notice && <p className="mt-1 text-slate-600">{res.notice}</p>}
              {res.href && <Link className="text-indigo-700 underline" href={res.href}>Start learning →</Link>}
              {res.sources?.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {res.sources.map((s: any) => <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.title}</a> · Tier {s.tier}</li>)}
                </ul>
              )}
            </>
          )}
          {(res.status === "unknown" || res.status === "refused") && <p className="text-slate-600">{res.text}</p>}
        </div>
      )}
    </div>
  );
}
