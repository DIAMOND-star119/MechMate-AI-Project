import { PrismaClient } from "@prisma/client";
import { ai } from "../lib/ai";

// One-off backfill: gives formulas + practice questions to DB subtopics that
// only have a concept (AI-requested lessons created before content
// generation existed), plus two starter subtopics for the empty
// "Fundamentals of Nuclear Decay" topic. Additive only: never deletes or
// replaces existing rows. Run with DATABASE_URL + GROQ_API_KEY in env:
//   tsx prisma/backfill-lessons.ts
const db = new PrismaClient();

const STARTER_SUBTOPICS: { topic: string; name: string; concept: string }[] = [
  {
    topic: "Fundamentals of Nuclear Decay",
    name: "Nuclear decay modes",
    concept: "Some atoms are unstable and transform over time: they shed a heavy particle (alpha), turn a neutron into a proton (beta), or give off pure energy (gamma)."
  },
  {
    topic: "Fundamentals of Nuclear Decay",
    name: "Half-life",
    concept: "Half-life is the time for half the nuclei in a sample to decay. After each half-life the undecayed fraction halves: 1, 1/2, 1/4, 1/8."
  }
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function draftWithRetry(name: string, concept: string, topicName: string) {
  let lastError: unknown = new Error("no attempts");
  // Groq free tier is flaky (empty replies, 429s): retry with backoff.
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await ai.draftLesson(name, concept, topicName);
    } catch (e) {
      lastError = e;
      console.log(`  attempt ${attempt} failed for ${name}: ${(e as Error).message}`);
      await sleep(15000 * attempt);
    }
  }
  throw lastError;
}

async function fillSubtopic(subId: string, name: string, concept: string, topicName: string) {
  const existing = await db.formula.count({ where: { subtopicId: subId } });
  if (existing > 0) {
    console.log(`skip ${name}: already has content`);
    return;
  }
  const lesson = await draftWithRetry(name, concept, topicName);
  for (const f of lesson.formulas) {
    await db.formula.create({
      data: { latex: f.latex, symbols: f.symbols, whenToUse: f.when_to_use, subtopicId: subId }
    });
  }
  for (const q of lesson.practice) {
    await db.practiceQuestion.create({
      data: { promptLatex: q.prompt, difficulty: q.difficulty, prerequisites: [], answer: q.answer, subtopicId: subId }
    });
  }
  console.log(`filled ${name}: ${lesson.formulas.length} formulas, ${lesson.practice.length} questions`);
}

async function main() {
  if (ai.id !== "groq") throw new Error(`refusing to backfill with provider ${ai.id}; set GROQ_API_KEY`);
  for (const s of STARTER_SUBTOPICS) {
    const topic = await db.topic.findFirst({ where: { name: s.topic } });
    if (!topic) {
      console.log(`topic missing, skip: ${s.topic}`);
      continue;
    }
    await db.subtopic.upsert({
      where: { topicId_name: { topicId: topic.id, name: s.name } },
      update: { concept: s.concept },
      create: { name: s.name, concept: s.concept, topicId: topic.id }
    });
  }
  const empties = await db.subtopic.findMany({
    where: { formulas: { none: {} } },
    include: { topic: { select: { name: true } } }
  });
  console.log(`found ${empties.length} content-less subtopics`);
  for (const sub of empties) {
    try {
      await fillSubtopic(sub.id, sub.name, sub.concept, sub.topic.name);
    } catch (e) {
      console.log(`FAILED ${sub.name}: ${(e as Error).message}`);
    }
  }
}

main().then(() => db.$disconnect());
