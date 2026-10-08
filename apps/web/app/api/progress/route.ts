import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

// Weakest-first ordering lives client-side; here we just persist + return.
export async function GET() {
  const uid = await userId();
  if (!uid) return NextResponse.json({ progress: [] });
  const progress = await db.progress.findMany({ where: { userId: uid } });
  return NextResponse.json({ progress });
}

export async function POST(req: Request) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { subtopicId, status } = (await req.json()) as { subtopicId?: string; status?: string };
  if (!subtopicId || !["encountered", "mastered", "struggling", "strong"].includes(status ?? "")) {
    return NextResponse.json({ error: "subtopicId + valid status required" }, { status: 400 });
  }
  const subtopic = await db.subtopic.findFirst({ where: { name: subtopicId } });
  if (!subtopic) return NextResponse.json({ error: "unknown subtopic — seed it first" }, { status: 404 });
  const row = await db.progress.upsert({
    where: { userId_subtopicId: { userId: uid, subtopicId: subtopic.id } },
    update: { status },
    create: { userId: uid, subtopicId: subtopic.id, status: status as string }
  });
  return NextResponse.json({ progress: row });
}
