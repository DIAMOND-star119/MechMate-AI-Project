import { db } from "./db";

// Completion vs mastery (brief §§5–6). Coverage is DERIVED from evidence rows:
// a section is covered only if the linked subtopic has a Progress row (studied)
// or — for practice sections — the topic has real attempts. Clicks never count.

export const MASTERY_RULE = {
  minQuestions: 5,
  minDifficulties: 2,
  minRate: 0.8
};

export interface SectionState {
  title: string;
  kind: string;
  covered: boolean;
}

export interface TopicState {
  topic: string;
  sections: SectionState[];
  completed: boolean;
  mastered: boolean;
  attempts: number;
  correctRate: number | null;
  difficulties: number[];
}

export async function getTopicState(userId: string, topicId: string): Promise<TopicState> {
  const [topic, progress, attempts] = await Promise.all([
    db.topic.findUnique({
      where: { id: topicId },
      include: { sections: { orderBy: { position: "asc" }, include: { subtopic: { select: { id: true } } } } }
    }),
    db.progress.findMany({ where: { userId }, select: { subtopicId: true } }),
    db.attempt.findMany({
      where: { userId, question: { subtopic: { topicId } } },
      select: { correct: true, question: { select: { difficulty: true } } }
    })
  ]);
  const studied = new Set(progress.map((p) => p.subtopicId));
  const topicAttempts = attempts.length > 0;
  const sections: SectionState[] = (topic?.sections ?? []).map((s) => ({
    title: s.title,
    kind: s.kind,
    covered: s.subtopicId ? studied.has(s.subtopicId) : topicAttempts
  }));
  const completed = sections.length > 0 && sections.every((s) => s.covered);
  const correct = attempts.filter((a) => a.correct).length;
  const difficulties = Array.from(new Set(attempts.map((a) => a.question.difficulty)));
  const rate = attempts.length ? correct / attempts.length : null;
  const mastered =
    completed &&
    attempts.length >= MASTERY_RULE.minQuestions &&
    difficulties.length >= MASTERY_RULE.minDifficulties &&
    (rate ?? 0) >= MASTERY_RULE.minRate;
  return {
    topic: topic?.name ?? topicId,
    sections,
    completed,
    mastered,
    attempts: attempts.length,
    correctRate: rate,
    difficulties
  };
}
