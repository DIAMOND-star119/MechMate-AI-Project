"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "../lib/auth-client";

// Identity (brief §§22–23): username + password + confirm. Email never required.
// Guests keep browsing; signing up offers to carry guest progress over.
export function AuthBar() {
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (isPending) return <p className="text-sm text-indigo-200">…</p>;
  const raw = session?.user;
  const user = raw as undefined | (NonNullable<typeof raw> & { isAnonymous?: boolean; username?: string });
  if (user && !user.isAnonymous) {
    return (
      <div className="flex items-center gap-2 text-sm text-indigo-100">
        <Link href="/profile" aria-label="Profile" className="grid h-9 w-9 place-items-center rounded-full bg-white font-bold text-indigo-700">
          {(user.username ?? user.name ?? "S").slice(0, 1).toUpperCase()}
        </Link>
        <span>{user.username ?? user.name ?? "Student"}</span>
        <button className="rounded-full border border-indigo-300 px-3 py-1" onClick={() => authClient.signOut()}>Sign out</button>
      </div>
    );
  }

  async function submit() {
    setError("");
    if (!username.trim() || !password) return setError("Username and password are required.");
    if (mode === "up" && password !== confirm) return setError("Passwords do not match.");
    const anonId = user?.isAnonymous ? user.id : null;
    try {
      if (mode === "up") {
        // Brief §22: email never required. better-auth's signup endpoint still
        // validates an email string, so accounts get a non-routable placeholder
        // the user never sees; a real recovery email can replace it in Profile.
        const placeholder = `${username.trim().toLowerCase()}@mechmate.local`;
        const r = await authClient.signUp.email({ email: placeholder, username: username.trim(), password, name: username.trim() } as any);
        if (r.error) return setError(r.error.message ?? "Sign up failed.");
      } else {
        const r = await (authClient.signIn as any).username({ username: username.trim(), password, rememberMe: true });
        if (r.error) return setError(r.error.message ?? "Sign in failed.");
      }
      if (anonId) {
        await fetch("/api/account/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonymousId: anonId })
        }).catch(() => {});
      }
      setUsername("");
      setPassword("");
      setConfirm("");
    } catch {
      setError("Something went wrong. Try again.");
    }
  }

  const input = "w-32 rounded-full border border-indigo-300 bg-transparent px-3 py-1 text-sm text-white placeholder:text-indigo-300";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700" onClick={() => authClient.signIn.anonymous()}>
        Continue as guest
      </button>
      <button className="rounded-full border border-indigo-300 px-3 py-1 text-sm text-white" onClick={() => setMode(mode === "up" ? "in" : "up")}>
        {mode === "up" ? "Sign in" : "Sign up"}
      </button>
      <input className={input} placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} aria-label="Username" />
      <input className={input} placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
      {mode === "up" && (
        <input className={input} placeholder="confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Confirm password" />
      )}
      <button className="rounded-full border border-indigo-300 px-3 py-1 text-sm text-white disabled:opacity-50"
        disabled={!username.trim() || !password || (mode === "up" && !confirm)} onClick={submit}>
        {mode === "up" ? "Sign up" : "Log in"}
      </button>
      {error && <span className="text-xs text-amber-300">{error}</span>}
    </div>
  );
}
