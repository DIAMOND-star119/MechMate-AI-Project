import { NextResponse } from "next/server";
import { aiProviderId } from "../../../lib/ai";

// Provider health without ever exposing secrets: returns reachability and
// HTTP status only. Use it to tell a bad key (401) from a bad model (404)
// or a down local runtime (connection refused).
export async function GET() {
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
      });
      const models: string[] = res.ok
        ? (((await res.json()) as { data?: { id?: string }[] }).data ?? []).map((m) => m.id ?? "?").slice(0, 30)
        : [];
      return NextResponse.json({ provider: aiProviderId, live: res.ok, detail: `groq:http-${res.status}`, models });
    } catch {
      return NextResponse.json({ provider: aiProviderId, live: false, detail: "groq:unreachable" });
    }
  }
  try {
    const host = process.env.OLLAMA_HOST ?? "http://localhost:11434";
    const res = await fetch(`${host}/api/tags`);
    return NextResponse.json({ provider: aiProviderId, live: res.ok, detail: `ollama:http-${res.status}` });
  } catch {
    return NextResponse.json({ provider: aiProviderId, live: false, detail: "ollama:unreachable" });
  }
}
