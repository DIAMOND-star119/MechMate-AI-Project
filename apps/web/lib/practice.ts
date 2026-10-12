// Deterministic practice engine (PRD §§9–11). Pure functions — no I/O,
// so they unit-test without a DB. Richer explanations arrive with the
// AI layer (Phase 5); here corrections stay concise by rule.

export interface PracticeItem {
  id: string;
  difficulty: number;
  prompt: string;
  answer: string;
  prerequisites: string[];
}

export interface AttemptResult {
  id: string;
  correct: boolean;
  prerequisites: string[];
  answer: string;
  given: string;
}

export function sortByDifficulty(items: PracticeItem[]): PracticeItem[] {
  return [...items].sort((a, b) => a.difficulty - b.difficulty);
}

/** Adaptive rule: start at 1; +1 after 2 consecutive correct (if harder
 *  exists); step down on a miss (never below 1); never just ratchets up. */
export function nextLevel(current: number, streak: number, wasCorrect: boolean, maxLevel: number): number {
  if (wasCorrect) {
    if (streak >= 2 && current < maxLevel) return current + 1;
    return current;
  }
  return Math.max(1, current - 1);
}

export interface Summary {
  score: number;
  total: number;
  missed: AttemptResult[];
  strengths: string[];
}

export function summarize(results: AttemptResult[]): Summary {
  const missed = results.filter((r) => !r.correct);
  const strengths = Array.from(new Set(results.filter((r) => r.correct).flatMap((r) => r.prerequisites)));
  return { score: results.length - missed.length, total: results.length, missed, strengths };
}

export function correctionLine(r: AttemptResult): string {
  return `Correct answer: ${r.answer}. You gave "${r.given || "—"}". Review: ${r.prerequisites.join(", ") || "the concept above"}.`;
}

// Fair grading: numeric answers compare by VALUE within tolerance, not by
// exact string. "17.32 m/s" counts for "17.3 m/s". Units must not conflict:
// equal (after normalization) or omitted on the student's side both pass.
export function answersMatch(given: string, expected: string): boolean {
  const g = given.trim().toLowerCase();
  const e = expected.trim().toLowerCase();
  if (g === e) return true;
  const gn = parseNumeric(g);
  const en = parseNumeric(e);
  if (!gn || !en) return false;
  if (gn.unit && en.unit && gn.unit !== en.unit) return false;
  const tol = 0.05 + 0.005 * Math.abs(en.value);
  return Math.abs(gn.value - en.value) <= tol;
}

function parseNumeric(s: string): { value: number; unit: string } | null {
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m || m === null) return null;
  const value = Number(m[0]);
  if (!Number.isFinite(value)) return null;
  const unit = s
    .slice(m.index! + m[0].length)
    .replace(/[\s.,;]+$/g, "")
    .replace(/\s+/g, "")
    .replace(/\^2/g, "²");
  return { value, unit };
}
