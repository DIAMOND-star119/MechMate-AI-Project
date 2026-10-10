"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "./Math";

interface Msg {
  role: "bot" | "user";
  text: string;
  source?: string;
}

export function CompanionPreview({ topics, initial }: { topics: { subtopic: string; topic: string }[]; initial?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const started = useRef(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hi — I'm your study companion (preview). Pick a topic and I'll teach it step by step. Ask anything, anytime." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function callApi(path: string, body: object): Promise<{ text: string; source: string }> {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  async function start(topic: string) {
    if (busy) return;
    setActive(topic);
    setBusy(true);
    try {
      const c = await callApi("/api/explain", { kind: "concept", subtopicId: topic });
      setMsgs((m) => [...m, { role: "bot", text: `Let's learn ${topic}. First, the concept:\n${c.text}`, source: c.source }]);
      const f = await callApi("/api/explain", { kind: "formula", subtopicId: topic });
      setMsgs((m) => [...m, { role: "bot", text: `Now the key formula:\n${f.text}`, source: f.source }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Couldn't start the lesson. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initial && !started.current && topics.some((t) => t.subtopic === initial)) {
      started.current = true;
      start(initial);
    }
  }, [initial, topics]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy || !active) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const a = await callApi("/api/ask", { question: q, subtopicId: active });
      setMsgs((m) => [...m, { role: "bot", text: a.text, source: a.source }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Lost connection. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function notUnderstood() {
    send("Explain that differently — use an analogy or a simpler example.");
  }

  return (
    <div>
      {!active && (
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button key={t.subtopic} disabled={busy}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              onClick={() => start(t.subtopic)}>
              Teach me {t.subtopic}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-3" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-8 rounded-xl bg-indigo-600 p-3 text-sm text-white" : "mr-8 rounded-xl border border-slate-200 bg-white p-3"}>
            <p className="whitespace-pre-line text-sm"><RichText text={m.text} /></p>
            {m.source && <p className="mt-1 text-xs text-slate-500">{m.source === "live" ? "Live" : "Curated preview"} · connected to {active ?? "lesson"}</p>}
          </div>
        ))}
      </div>
      {active && (
        <div className="mt-4">
          <div className="flex gap-2">
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              aria-label="Ask the companion" placeholder="Ask anything, or say you don't understand…" />
            <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              onClick={() => send()} disabled={busy || !input.trim()}>Send</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-full border px-3 py-1 text-sm" onClick={notUnderstood} disabled={busy}>I don&apos;t understand</button>
            <Link className="rounded-full border px-3 py-1 text-sm text-indigo-700" href={`/learn/${active.toLowerCase()}`}>Try practice →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
