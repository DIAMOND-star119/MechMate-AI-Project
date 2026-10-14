"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "./Math";

interface Msg {
  key: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
  save: "saved" | "pending" | "failed";
}

interface Convo {
  id: string;
  title: string;
  topic: string | null;
  updatedAt: string;
  messages: number;
}

function dayGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 8) return "Previous 7 days";
  return "Older";
}

function newKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// A message asks for a full lesson (not just an answer) when it looks like
// a teaching request. Ordinary questions never trigger lesson creation.
function isLessonRequest(text: string): boolean {
  return /\b(teach me|create (me )?notes?|explain .* (from (the beginning|scratch)|in full)|give me .* formulas?|study guide|full lesson|entire topic)\b/i.test(
    text
  );
}

export function CompanionPreview({ topics, initial }: { topics: { subtopic: string; topic: string }[]; initial?: string }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [chats, setChats] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(initial ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState("");
  const [offer, setOffer] = useState<null | {
    q: string;
    state: "offer" | "building" | "done" | "error";
    href?: string;
    topic?: string;
    text?: string;
  }>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const activeTopicRef = useRef<string | null>(activeTopic);
  activeTopicRef.current = activeTopic;

  const loadList = useCallback(async () => {
    const r = await fetch("/api/chats");
    if (r.status === 401) return setAuthed(false);
    setAuthed(true);
    setChats(((await r.json()) as { chats: Convo[] }).chats);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  async function openChat(id: string) {
    const r = await fetch(`/api/chats/${id}`);
    if (!r.ok) return;
    const d = (await r.json()) as { conversation: Convo; messages: { role: string; text: string; source?: string }[] };
    setActiveId(id);
    setActiveTopic(d.conversation.topic);
    setMsgs(d.messages.map((m) => ({ key: newKey(), role: m.role as Msg["role"], text: m.text, source: m.source, save: "saved" as const })));
    setDrawer(false);
  }

  function newChat() {
    setActiveId(null);
    setActiveTopic(null);
    setMsgs([]);
    setDrawer(false);
  }

  async function persist(id: string, batch: { role: string; text: string; source?: string; key: string }[]) {
    const r = await fetch(`/api/chats/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: batch })
    });
    if (!r.ok) throw new Error("save failed");
  }

  async function send(text?: string) {
    const q = (text ?? input).trim();
    // Preset chip topic wins; otherwise the student's own typed topic works —
    // questions are no longer restricted to the preset list.
    let topic = activeTopicRef.current ?? (custom.trim() || null);
    if (!q || busy || !topic) return;
    topic = topic.slice(0, 120);
    if (!activeTopicRef.current) setActiveTopic(topic);
    const ukey = newKey();
    const akey = newKey();
    setMsgs((m) => [...m, { key: ukey, role: "user", text: q, save: "pending" as const }]);
    setInput("");
    setBusy(true);
    try {
      let id = activeId;
      if (!id) {
        const c = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, message: q })
        });
        if (!c.ok) throw new Error("create failed");
        id = ((await c.json()) as { conversation: { id: string } }).conversation.id;
        setActiveId(id);
        loadList();
      } else {
        await persist(id, [{ role: "user", text: q, key: ukey }]);
        setMsgs((m) => m.map((x) => (x.key === ukey ? { ...x, save: "saved" as const } : x)));
      }
      const history = [...msgs.filter((x) => x.save !== "failed"), { key: ukey, role: "user" as const, text: q, save: "saved" as const }]
        .slice(-12)
        .map((x) => ({ role: x.role === "assistant" ? "assistant" : "user", text: x.text }));
      setMsgs((m) => [...m, { key: akey, role: "assistant", text: "", save: "pending" as const }]);
      const a = await (await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, subtopicId: topic, history })
      })).json();
      setMsgs((m) => m.map((x) => (x.key === akey ? { ...x, text: a.text, source: a.source, save: "saved" as const } : x)));
      await persist(id!, [
        ...(activeId ? [] : [{ role: "user", text: q, key: ukey }]),
        { role: "assistant", text: a.text, source: a.source, key: akey }
      ]).catch(() => {
        setMsgs((m) => m.map((x) => (x.key === akey ? { ...x, save: "failed" as const } : x)));
      });
      // Lesson intent, not just a question: offer to build the full
      // structured lesson (formulas, practice, progress) exactly once.
      if (isLessonRequest(q)) setOffer({ q, state: "offer" });
      fetch(`/api/chats/${id}/title`, { method: "POST" })
        .then((r) => r.json())
        .then((d) => d.title && loadList())
        .catch(() => {});
    } catch {
      setMsgs((m) => m.map((x) => (x.key === ukey || x.key === akey ? { ...x, save: "failed" as const } : x)));
    } finally {
      setBusy(false);
    }
  }

  async function retry(key: string) {
    const idx = msgs.findIndex((x) => x.key === key);
    const m = msgs[idx];
    if (!m || !activeId || busy) return;
    setBusy(true);
    try {
      if (m.role === "user") {
        // Re-post the same key: server dedups if it actually landed.
        await persist(activeId, [{ role: "user", text: m.text, key: m.key }]);
        setMsgs((x) => x.map((y) => (y.key === key ? { ...y, save: "saved" as const } : y)));
      } else {
        const q = [...msgs.slice(0, idx)].reverse().find((x) => x.role === "user");
        if (!q) return;
        const a = await (await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q.text, subtopicId: activeTopicRef.current, history: [] })
        })).json();
        setMsgs((x) => x.map((y) => (y.key === key ? { ...y, text: a.text, source: a.source, save: "pending" as const } : y)));
        await persist(activeId, [{ role: "assistant", text: a.text, source: a.source, key }]);
        setMsgs((x) => x.map((y) => (y.key === key ? { ...y, save: "saved" as const } : y)));
      }
    } catch {
      /* stays failed — user can retry again */
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string) {
    const t = renameText.trim().slice(0, 120);
    if (!t) return;
    await fetch(`/api/chats/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t }) });
    setRenaming(null);
    loadList();
  }

  async function remove(id: string) {
    if (!confirm("Delete this conversation permanently? This cannot be undone.")) return;
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (activeId === id) newChat();
    loadList();
  }

  // Turn a "teach me X" message into a full structured lesson. Ordinary
  // questions never reach here — only explicit user taps.
  async function buildLesson() {
    if (!offer || offer.state === "building" || offer.state === "done") return;
    setOffer({ ...offer, state: "building" });
    try {
      const r = await fetch("/api/topics/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: offer.q })
      });
      const d = (await r.json()) as { status?: string; href?: string; topic?: string; text?: string };
      if (d.href) {
        setOffer({ ...offer, state: "done", href: d.href, topic: d.topic });
      } else {
        setOffer({ ...offer, state: "error", text: d.text ?? "Couldn't build that lesson yet." });
      }
    } catch {
      setOffer({ ...offer, state: "error", text: "Couldn't reach the server. Try again." });
    }
  }

  if (authed === false) {
    return (
      <div className="rounded-xl border p-4 text-sm text-slate-600">
        <p><b>Sign in to keep your chats.</b> Conversations save to your account so they survive refreshes, devices, and logouts.</p>
        <Link className="mt-2 inline-block rounded-full bg-indigo-600 px-4 py-2 font-bold text-white" href="/">← Back home to sign in</Link>
      </div>
    );
  }

  const groups: Record<string, Convo[]> = {};
  for (const c of chats) {
    const g = dayGroup(c.updatedAt);
    (groups[g] = groups[g] || []).push(c);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-extrabold text-slate-800">MechMate <span className="text-indigo-600">x</span></Link>
        <button className="rounded-full border px-2 py-0.5 text-xs" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? "»" : "«"}
        </button>
      </div>
      {!collapsed && (
        <>
          <button className="mt-3 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" onClick={newChat}>+ New chat</button>
          <div className="mt-3 flex-1 space-y-4 overflow-y-auto pr-1">
            {chats.length === 0 && <p className="text-xs text-slate-500">No conversations yet. Pick a topic to begin.</p>}
            {Object.entries(groups).map(([g, list]) => (
              <div key={g}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{g}</p>
                <ul className="mt-1 space-y-1">
                  {list.map((c) => (
                    <li key={c.id} className={`group rounded-lg px-2 py-1.5 text-sm ${c.id === activeId ? "bg-indigo-50 font-bold" : "hover:bg-slate-100"}`}>
                      {renaming === c.id ? (
                        <span className="flex gap-1">
                          <input className="w-full rounded border px-1 text-sm" value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") rename(c.id); if (e.key === "Escape") setRenaming(null); }}
                            aria-label="Conversation title" autoFocus />
                          <button className="text-xs text-indigo-700" onClick={() => rename(c.id)}>Save</button>
                        </span>
                      ) : (
                        <span className="flex items-center justify-between gap-1">
                          <button className="min-w-0 flex-1 truncate text-left" onClick={() => openChat(c.id)} title={c.title}>{c.title}</button>
                          <button className="rounded px-1 text-slate-400 hover:text-slate-700" aria-label={`Options for ${c.title}`}
                            onClick={() => setMenu(menu === c.id ? null : c.id)}>⋯</button>
                        </span>
                      )}
                      {menu === c.id && renaming !== c.id && (
                        <span className="mt-1 flex gap-2 text-xs">
                          <button className="text-indigo-700" onClick={() => { setRenameText(c.title); setRenaming(c.id); setMenu(null); }}>Rename</button>
                          <button className="text-red-600" onClick={() => { setMenu(null); remove(c.id); }}>Delete</button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="md:flex md:gap-4">
      <div className="mb-3 flex gap-2 md:hidden">
        <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setDrawer(true)} aria-label="Open conversations">☰ Chats</button>
        <button className="rounded-full border px-4 py-2 text-sm" onClick={newChat}>+ New</button>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-label="Conversations">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl">{sidebar}</div>
        </div>
      )}
      <aside className={`hidden w-64 shrink-0 rounded-xl border border-slate-200 bg-white p-3 md:block ${collapsed ? "md:w-14" : ""}`}>{sidebar}</aside>

      <div className="min-w-0 flex-1">
        {!activeId && msgs.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {topics.map((t) => (
              <button key={t.subtopic} disabled={busy}
                className={`rounded-full px-4 py-2 text-sm font-bold ${activeTopic === t.subtopic ? "bg-indigo-800 text-white" : "bg-indigo-600 text-white"} disabled:opacity-50`}
                onClick={() => { setActiveTopic(t.subtopic); setCustom(""); }}>
                {t.subtopic}
              </button>
            ))}
          </div>
        )}
        {!activeTopic && (
          <div className="mb-3 flex gap-2">
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") (document.getElementById("companion-send") as HTMLButtonElement | null)?.click(); }}
              aria-label="Or type any study topic" placeholder="Or type any topic — e.g. thermodynamics, Shakespeare…" />
          </div>
        )}
        <div className="max-w-2xl space-y-3" aria-live="polite">
          {msgs.length === 0 && (
            <p className="text-sm text-slate-500">
              {activeTopic ? `Studying ${activeTopic} — ask your first question below. It saves automatically.` : "Pick a topic above, then ask anything."}
            </p>
          )}
          {msgs.map((m) => (
            <div key={m.key} className={m.role === "user" ? "ml-8 rounded-xl bg-indigo-600 p-3 text-white" : "mr-8 rounded-xl border border-slate-200 bg-white p-3"}>
              {m.text
                ? <div className="whitespace-pre-line text-sm"><RichText text={m.text} /></div>
                : <p className="text-sm text-slate-400">Thinking…</p>}
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                {m.source && <span>{m.source === "live" ? "Live" : "Curated"}</span>}
                {m.save === "pending" && <span>Saving…</span>}
                {m.save === "failed" && (
                  <span className="text-amber-700">Not saved <button className="underline" onClick={() => retry(m.key)}>Retry</button></span>
                )}
              </p>
            </div>
          ))}
        </div>
        <div className="sticky bottom-2 mt-4 max-w-2xl">
          <div className="flex gap-2">
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              aria-label="Message the companion" placeholder={activeTopic ?? custom.trim() ? `Ask about ${activeTopic ?? custom.trim()}…` : "Pick a topic above, or type one…"} disabled={busy || !(activeTopic ?? custom.trim())} />
            <button id="companion-send" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              onClick={() => send()} disabled={busy || !input.trim() || !(activeTopic ?? custom.trim())}>Send</button>
          </div>
          {offer && (
            <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm" aria-live="polite">
              {offer.state === "offer" && (
                <div className="flex flex-wrap items-center gap-2">
                  <span>Want this as a full lesson (notes, formulas, practice, progress)?</span>
                  <button className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white" onClick={buildLesson}>Build structured lesson</button>
                  <button className="text-xs text-slate-500 underline" onClick={() => setOffer(null)}>No thanks</button>
                </div>
              )}
              {offer.state === "building" && <p>Building your lesson…</p>}
              {offer.state === "done" && offer.href && (
                <p><b>{offer.topic ?? "Lesson"} is ready.</b> <Link className="text-indigo-700 underline" href={offer.href}>Open structured lesson →</Link></p>
              )}
              {offer.state === "error" && (
                <p>{offer.text} <button className="underline" onClick={buildLesson}>Retry</button></p>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-full border bg-white px-3 py-1 text-sm" onClick={() => send("Explain that differently — use an analogy or a simpler example.")} disabled={busy || !activeTopic}>I don&apos;t understand</button>
            {activeTopic && <Link className="rounded-full border bg-white px-3 py-1 text-sm text-indigo-700" href={`/learn/${encodeURIComponent(activeTopic.toLowerCase())}`}>Study notes · Practice →</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
