import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { sessionUserId, getOwned } from "../../../../../lib/chats";
import { ai } from "../../../../../lib/ai";

// Auto-title after the first exchange (fire-and-forget from the client so it
// never delays the conversation). Falls back to topic + date; renamable anytime.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await sessionUserId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const convo = await getOwned(uid, (await params).id);
  if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (convo.title !== "New chat") return NextResponse.json({ title: convo.title });
  let title = convo.topic ? `${convo.topic} — ${new Date().toLocaleDateString()}` : `Chat — ${new Date().toLocaleDateString()}`;
  try {
    const first = convo.messages.filter((m) => m.role === "user").slice(0, 2).map((m) => m.text);
    if (first.length) title = await ai.makeTitle(first);
  } catch {
    /* fallback above */
  }
  const updated = await db.conversation.update({ where: { id: convo.id }, data: { title } });
  return NextResponse.json({ title: updated.title });
}
