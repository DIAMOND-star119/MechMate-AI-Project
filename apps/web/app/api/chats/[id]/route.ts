import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { sessionUserId, getOwned } from "../../../../lib/chats";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await sessionUserId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const convo = await getOwned(uid, (await params).id);
  if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    conversation: { id: convo.id, title: convo.title, topic: convo.topic, updatedAt: convo.updatedAt },
    messages: convo.messages.map((m) => ({ id: m.id, role: m.role, text: m.text, seq: m.seq, source: m.source }))
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await sessionUserId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { title } = (await req.json()) as { title?: string };
  const clean = (title ?? "").trim().slice(0, 120);
  if (!clean) return NextResponse.json({ error: "title required" }, { status: 400 });
  const convo = await getOwned(uid, (await params).id);
  if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 });
  const updated = await db.conversation.update({ where: { id: convo.id }, data: { title: clean } });
  return NextResponse.json({ conversation: { id: updated.id, title: updated.title } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await sessionUserId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const convo = await getOwned(uid, (await params).id);
  if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.conversation.delete({ where: { id: convo.id } });
  return NextResponse.json({ ok: true });
}
