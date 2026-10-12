import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { sessionUserId } from "../../../lib/chats";

// List mine, newest first. No empty-conversation endpoint exists: creation
// always carries the first message (see POST below).
export async function GET() {
  const uid = await sessionUserId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const chats = await db.conversation.findMany({
    where: { userId: uid },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } }
  });
  return NextResponse.json({
    chats: chats.map((c) => ({ id: c.id, title: c.title, topic: c.topic, updatedAt: c.updatedAt, messages: c._count.messages }))
  });
}

// Create WITH the first user message in one transaction — an untouched
// composer never writes anything, and starting fresh never clobbers history.
export async function POST(req: Request) {
  const uid = await sessionUserId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { topic, message } = (await req.json()) as { topic?: string; message?: string };
  const text = (message ?? "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "message required" }, { status: 400 });
  const convo = await db.conversation.create({
    data: {
      userId: uid,
      title: "New chat",
      topic: (topic ?? "").slice(0, 120) || null,
      messages: { create: { role: "user", text, seq: 0 } }
    },
    include: { messages: true }
  });
  return NextResponse.json({ conversation: { id: convo.id, title: convo.title, topic: convo.topic }, message: convo.messages[0] });
}
