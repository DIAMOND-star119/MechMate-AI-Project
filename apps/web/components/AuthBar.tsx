"use client";

import { useState } from "react";
import { authClient } from "../lib/auth-client";

export function AuthBar() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isPending) return <p className="text-sm text-indigo-200">…</p>;
  if (session?.user && !session.user.isAnonymous) {
    return (
      <div className="flex items-center gap-2 text-sm text-indigo-100">
        <span>{session.user.email ?? session.user.name ?? "Student"}</span>
        <button className="rounded-full border border-indigo-300 px-3 py-1" onClick={() => authClient.signOut()}>Sign out</button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700"
        onClick={() => authClient.signIn.anonymous()}
      >
        Continue as guest
      </button>
      <input
        className="w-40 rounded-full border border-indigo-300 bg-transparent px-3 py-1 text-sm text-white placeholder:text-indigo-300"
        placeholder="email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-32 rounded-full border border-indigo-300 bg-transparent px-3 py-1 text-sm text-white placeholder:text-indigo-300"
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="rounded-full border border-indigo-300 px-3 py-1 text-sm text-white disabled:opacity-50"
        disabled={!email || !password}
        onClick={() => authClient.signUp.email({ email, password, name: email.split("@")[0] })}
      >
        Save progress
      </button>
    </div>
  );
}
