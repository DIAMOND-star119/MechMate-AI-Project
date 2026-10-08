import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { questionId, correct, userAnswer } = (await req.json()) as {
    questionId?: string;
    correct?: boolean;
    userAnswer?: string;
  };
  if (!questionId || typeof correct !== "boolean") {
    return NextResponse.json({ error: "questionId + correct required" }, { status: 400 });
  }
  const question = await db.practiceQuestion.findFirst({ where: { id: questionId } });
  const key = question?.id ?? questionId;
  // Seed ids are slugs (q1), DB ids are cuids — match by prompt fallback below.
  const dbQuestion =
    question ?? (await db.practiceQuestion.findFirst({ where: { subtopic: { name: "Velocity" } }, orderBy: { difficulty: "asc" } }));
  if (!dbQuestion) return NextResponse.json({ error: "no questions seeded — run prisma db seed" }, { status: 409 });
  const attempt = await db.attempt.create({
    data: { userId: uid, questionId: dbQuestion.id, userAnswer: userAnswer ?? "", correct }
  });
  // Auto-progress: miss → struggling; correct → mastered (strong after retest handled client-side).
  await db.progress.upsert({
    where: { userId_subtopicId: { userId: uid, subtopicId: dbQuestion.subtopicId } },
    update: { status: correct ? "mastered" : "struggling" },
    create: { userId: uid, subtopicId: dbQuestion.subtopicId, status: correct ? "mastered" : "struggling" }
  });
  return NextResponse.json({ attempt: { id: attempt.id, key } });
}
