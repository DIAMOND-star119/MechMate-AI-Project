import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { questionId, correct, userAnswer, subtopic, prompt } = (await req.json()) as {
    questionId?: string;
    correct?: boolean;
    userAnswer?: string;
    subtopic?: string;
    prompt?: string;
  };
  if (!questionId || typeof correct !== "boolean") {
    return NextResponse.json({ error: "questionId + correct required" }, { status: 400 });
  }
  // Resolve the real question row. Curated lesson items use slug ids ("q1")
  // shared across subtopics, so id alone can mismatch: disambiguate with the
  // subtopic name + prompt text. NEVER silently attribute an attempt to the
  // wrong subtopic (that corrupts progress + mastery for two lessons).
  let dbQuestion = await db.practiceQuestion.findFirst({ where: { id: questionId } });
  let reason: "noid" | "nosub" | "noquestion" = "noid";
  let candidates = 0;
  if (!dbQuestion && subtopic && prompt) {
    const sub = await db.subtopic.findFirst({ where: { name: { equals: subtopic, mode: "insensitive" } } });
    if (!sub) {
      reason = "nosub";
    } else {
      // Prompts travel through JSON/HTML layers that can alter whitespace or
      // Unicode forms (arrows, superscripts): compare normalized forms.
      const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim();
      const want = norm(prompt);
      const rows = await db.practiceQuestion.findMany({ where: { subtopicId: sub.id } });
      candidates = rows.length;
      dbQuestion =
        rows.find((q) => q.promptLatex === prompt) ??
        rows.find((q) => norm(q.promptLatex) === want) ??
        null;
      if (!dbQuestion) reason = "noquestion";
    }
  }
  if (!dbQuestion) {
    return NextResponse.json(
      { error: "unknown question — no attempt recorded", reason, candidates },
      { status: 409 }
    );
  }
  const attempt = await db.attempt.create({
    data: { userId: uid, questionId: dbQuestion.id, userAnswer: userAnswer ?? "", correct }
  });
  // Auto-progress: miss → struggling; correct → mastered (strong after retest handled client-side).
  await db.progress.upsert({
    where: { userId_subtopicId: { userId: uid, subtopicId: dbQuestion.subtopicId } },
    update: { status: correct ? "mastered" : "struggling" },
    create: { userId: uid, subtopicId: dbQuestion.subtopicId, status: correct ? "mastered" : "struggling" }
  });
  return NextResponse.json({ attempt: { id: attempt.id, key: dbQuestion.id } });
}
