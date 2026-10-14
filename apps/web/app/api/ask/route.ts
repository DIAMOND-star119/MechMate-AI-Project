import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ai } from "../../../lib/ai";
import { auth } from "../../../lib/auth";
import { fallbackAnswer } from "../../../lib/fallback";
import { classify, refusalText, recordAlert } from "../../../lib/moderate";
import { rateLimit, clientIp } from "../../../lib/rate-limit";

export async function POST(req: Request) {
  const { question, subtopicId, formulaId, history } = (await req.json()) as {
    question?: string;
    subtopicId?: string;
    formulaId?: string;
    history?: { role: string; text: string }[];
  };
  if (!question?.trim() || !subtopicId) {
    return NextResponse.json({ error: "question and subtopicId required" }, { status: 400 });
  }
  if (!rateLimit(`ask:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ text: "Too many questions at once — wait a minute and try again.", source: "rate-limit" }, { status: 429 });
  }
  const mod = classify(question);
  if (mod.level !== "normal") {
    if (mod.level === "serious") {
      const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
      await recordAlert({
        userId: session?.user?.id ?? "guest",
        category: mod.category ?? "serious",
        request: question,
        messages: history ?? [],
        action: "refused"
      }).catch(() => {});
    }
    return NextResponse.json({ text: refusalText(mod.level, mod.category), source: "moderation", refused: true });
  }
  try {
    const text = await ai.answerQuestion(question.trim(), { subtopicId, formulaId }, history ?? []);
    return NextResponse.json({ text, source: "live" });
  } catch {
    return NextResponse.json(fallbackAnswer(question.trim(), subtopicId));
  }
}
