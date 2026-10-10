import { getSubtopic } from "./content";

// Curated fallback (PRD: facts/units/answers come from seed, never hallucinated).
// Used when the local model is missing or errors. Concise by rule.

export function fallbackAnswer(question: string, subtopicId: string): { text: string; source: "curated" } {
  const s = getSubtopic(subtopicId);
  const concept = s?.concept ?? "this concept";
  const f0 = s?.formulas[0];
  return {
    source: "curated",
    text:
      `On "${question}": ${concept}` +
      (f0 ? ` Key formula: $${f0.latex}$ — ${f0.when_to_use}` : "") +
      `\nConnection: this matters for ${s?.subtopic ?? subtopicId} because it uses ${f0 ? `$${f0.latex}$` : "the formula above"}.`
  };
}

export function fallbackExplain(kind: string, subtopicId: string, formulaId?: string): { text: string; source: "curated" } {
  const s = getSubtopic(subtopicId);
  const f = s?.formulas.find((x) => x.id === formulaId) ?? s?.formulas[0];
  switch (kind) {
    case "concept":
      return { source: "curated", text: s?.concept ?? "No curated concept yet." };
    case "derivation":
      return { source: "curated", text: f?.derivation ? `Derivation: ${f.derivation}` : "Derivation not curated for this formula yet — ask after the model is installed." };
    case "related":
      return { source: "curated", text: f?.related?.length ? `Related: ${f.related.join(", ")}.` : "No related formulas curated yet." };
    case "refresher":
      return {
        source: "curated",
        text: `Quick refresh — ${s?.subtopic ?? subtopicId}: ${f ? `$${f.latex}$` : ""}\nBack to the question →`
      };
    default:
      return { source: "curated", text: f ? `$${f.latex}$ — ${f.when_to_use}` : "No curated detail yet." };
  }
}
