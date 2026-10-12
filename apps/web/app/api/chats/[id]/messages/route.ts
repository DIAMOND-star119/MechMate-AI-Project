import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { sessionUserId, getOwned } from "../../../../../lib/chats";

const ROLES = ["user", "assistant"] as const;

// Append messages with server-allocated sequences (no duplicates on retry:
// the client sends an idempotency key per message and resends are deduped).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await sessionUserId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const convo = await getOwned(uid, (await params).id);
  if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { messages } = (await req.json()) as { messages?: { role?: string; text?: string; source?: string; key?: string }[] };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
    return NextResponse.json({ error: "1-20 messages required" }, { status: 400 });
  }
  for (const m of messages) {
    if (!ROLES.includes(m.role as (typeof ROLES)[number]) || !(m.text ?? "").trim()) {
      return NextResponse.json({ error: "each message needs role + text" }, { status: 400 });
    }
  }
  const base = convo.messages.length ? Math.max(...convo.messages.map((m) => m.seq)) + 1 : 0;
  const existing = await db.chatMessage.findMany({
    where: { conversationId: convo.id, key: { in: messages.map((m) => m.key).filter(Boolean) as string[] } }
  });
  const seen = new Set(existing.map((m) => m.key));
  const fresh = messages.filter((m) => !m.key || !seen.has(m.key));
  const saved = fresh.length
    ? await db.$transaction(
        fresh.map((m, i) =>
          db.chatMessage.create({
            data: {
              conversationId: convo.id,
              role: m.role!,
              text: m.text!.trim().slice(0, 8000),
              source: (m.source ?? "").slice(0, 40) || null,
              key: (m.key ?? "").slice(0, 80) || null,
              seq: base + i
            }
          })
        )
      )
    : [];
  const all = [...existing, ...saved].sort((a, b) => a.seq - b.seq);
  await db.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ messages: all.map((m) => ({ id: m.id, role: m.role, text: m.text, seq: m.seq, source: m.source })) });
}
