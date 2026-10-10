"use client";

import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { OnboardingForm } from "./OnboardingForm";

function ThemePicker() {
  const [theme, setTheme] = useState(() => (typeof document !== "undefined" ? document.documentElement.dataset.theme ?? "" : ""));
  function pick(t: string) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("mechmate-theme", t); } catch {}
    setTheme(t);
  }
  return (
    <div className="flex gap-2">
      <button className="rounded-full border px-3 py-1 text-sm" onClick={() => pick("")}>Dark marble {theme === "" && "✓"}</button>
      <button className="rounded-full border px-3 py-1 text-sm" onClick={() => pick("light")}>Light {theme === "light" && "✓"}</button>
    </div>
  );
}

export function ProfileClient({ username, email }: { username: string | null; email: string | null }) {
  const [name, setName] = useState("");
  const [recovery, setRecovery] = useState(email ?? "");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  async function saveName() {
    const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setMsg(r.ok ? "Name updated." : "Could not update name.");
  }
  async function saveRecovery() {
    const r = await authClient.updateUser({ email: recovery || undefined } as any);
    setMsg(r.error ? (r.error.message ?? "Could not save email.") : "Recovery email saved.");
  }
  async function changePassword() {
    const r = await authClient.changePassword({ currentPassword: prompt("Current password?") ?? "", newPassword: pw } as any);
    setMsg(r.error ? (r.error.message ?? "Could not change password.") : "Password changed.");
    setPw("");
  }
  async function remove() {
    if (!confirm("Delete your account and all learning data? This cannot be undone.")) return;
    await authClient.deleteUser();
    window.location.href = "/";
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="mm-card">
        <div className="mm-eyebrow">Account</div>
        <p className="text-sm text-slate-600">Username: <b>{username ?? "—"}</b> (usernames don&apos;t change)</p>
        <div className="mt-2 flex gap-2">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Display name"
            value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
          <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" onClick={saveName}>Save</button>
        </div>
        <div className="mt-2 flex gap-2">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="New password"
            type="password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" />
          <button className="rounded-full border px-4 py-2 text-sm" disabled={!pw} onClick={changePassword}>Change</button>
        </div>
        <div className="mt-2 flex gap-2">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Recovery email (optional)"
            value={recovery} onChange={(e) => setRecovery(e.target.value)} aria-label="Recovery email" />
          <button className="rounded-full border px-4 py-2 text-sm" onClick={saveRecovery}>Save</button>
        </div>
        {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
      </section>
      <section className="mm-card">
        <div className="mm-eyebrow">Appearance</div>
        <ThemePicker />
        <div className="mm-eyebrow mt-4">Learning preferences</div>
        <OnboardingForm />
      </section>
      <section className="mm-card">
        <div className="mm-eyebrow">Privacy</div>
        <p className="text-sm text-slate-600">
          Your progress is stored in this app&apos;s database. AI explanations may be processed by
          an external AI provider — never passwords, secrets, or account data. Moderation reviews
          use the minimum necessary information.
        </p>
      </section>
      <section className="mm-card">
        <div className="mm-eyebrow">Danger zone</div>
        <div className="flex gap-2">
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => authClient.signOut()}>Log out</button>
          <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white" onClick={remove}>Delete account</button>
        </div>
      </section>
    </div>
  );
}
