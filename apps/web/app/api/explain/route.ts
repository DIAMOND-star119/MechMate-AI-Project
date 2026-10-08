import { NextResponse } from "next/server";
import { ai } from "../../../lib/ai";
import { fallbackExplain } from "../../../lib/fallback";

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
