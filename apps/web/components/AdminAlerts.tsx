"use client";

import { useEffect, useState } from "react";

interface Alert {
  id: string;
  userId: string;
  createdAt: string;
  category: string;
  request: string;
  messages: { role: string; text: string }[];
  action: string;
  status: string;
}

export function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    const r = await fetch("/api/alerts?status=open");
    if (r.status === 403) return setForbidden(true);
    setAlerts(((await r.json()) as { alerts: Alert[] }).alerts);
  }
  useEffect(() => { load(); }, []);

  async function set(id: string, status: string) {
    await fetch("/api/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  }

  if (forbidden) return <p className="text-sm text-slate-600">Admins only.</p>;
  if (!alerts) return <p className="text-sm text-slate-500" role="status">Loading alerts…</p>;
  if (!alerts.length) return <p className="text-sm text-slate-600">No open alerts. Quiet is good.</p>;

  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <div key={a.id} className="rounded-lg border p-3">
          <p className="text-sm"><b>{a.category}</b> <span className="text-slate-500">· {a.userId} · {new Date(a.createdAt).toLocaleString()}</span></p>
          <p className="mt-1 text-sm">Request: {a.request}</p>
          {a.messages.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
              {a.messages.map((m, i) => <li key={i}><b>{m.role}:</b> {m.text}</li>)}
            </ul>
          )}
          <p className="mt-1 text-xs text-slate-500">Action: {a.action} · Status: {a.status}</p>
          <div className="mt-2 flex gap-2">
            {(["reviewed", "escalated", "dismissed"] as const).map((s) => (
              <button key={s} className="rounded-full border px-3 py-1 text-xs" onClick={() => set(a.id, s)}>Mark {s}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
