import { NextResponse } from "next/server";
import { ai } from "../../../lib/ai";
import { fallbackExplain } from "../../../lib/fallback";
import { rateLimit, clientIp } from "../../../lib/rate-limit";

const KINDS = ["concept", "formula", "derivation", "related", "refresher"] as const;

export async function POST(req: Request) {
  const { kind, subtopicId, formulaId, formulaLatex } = (await req.json()) as {
    kind?: string;
    subtopicId?: string;
    formulaId?: string;
    formulaLatex?: string;
  };
  if (!kind || !KINDS.includes(kind as (typeof KINDS)[number]) || !subtopicId) {
    return NextResponse.json({ error: "kind and subtopicId required" }, { status: 400 });
  }
  if (!rateLimit(`explain:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json(fallbackExplain(kind, subtopicId, formulaId));
  }
  try {
    const ctx = { subtopicId, formulaId };
    let text: string;
    switch (kind) {
      case "concept":
        text = await ai.explainConcept(subtopicId, ctx);
        break;
      case "refresher":
        text = await ai.refresher(subtopicId, ctx);
        break;
      default:
        text = await ai.expandFormula(formulaLatex ?? formulaId ?? "", ctx);
        break;
    }
    return NextResponse.json({ text, source: "live" });
  } catch {
    return NextResponse.json(fallbackExplain(kind, subtopicId, formulaId));
  }
}
