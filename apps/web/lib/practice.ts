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
