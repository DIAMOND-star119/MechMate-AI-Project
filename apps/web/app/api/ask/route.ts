import { NextResponse } from "next/server";
import { ai } from "../../../lib/ai";
import { fallbackAnswer } from "../../../lib/fallback";

export async function POST(req: Request) {
  const { question, subtopicId, formulaId } = (await req.json()) as {
    question?: string;
    subtopicId?: string;
    formulaId?: string;
  };
  if (!question?.trim() || !subtopicId) {
    return NextResponse.json({ error: "question and subtopicId required" }, { status: 400 });
  }
  try {
    const text = await ai.answerQuestion(question.trim(), { subtopicId, formulaId });
    return NextResponse.json({ text, source: "live" });
  } catch {
    return NextResponse.json(fallbackAnswer(question.trim(), subtopicId));
  }
}
