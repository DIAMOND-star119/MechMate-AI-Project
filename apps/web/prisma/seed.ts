import { PrismaClient } from "@prisma/client";
import displacement from "../../../content/kinematics/displacement.json";
import velocity from "../../../content/kinematics/velocity.json";
import acceleration from "../../../content/kinematics/acceleration.json";
import equationsOfMotion from "../../../content/kinematics/equations-of-motion.json";
import projectileMotion from "../../../content/kinematics/projectile-motion.json";
import nuclearDecayModes from "../../../content/radioactivity/nuclear-decay-modes.json";

// Curated catalogue seed. SAFE to re-run: everything is keyed upserts, and
// formulas/questions are only written when the subtopic has none yet —
// existing content (and the attempts pointing at it) is never deleted or
// replaced. Sections are only created for topics that have none.
const CURATED = [displacement, velocity, acceleration, equationsOfMotion, projectileMotion, nuclearDecayModes] as {
  subtopic: string;
  topic: string;
  subject: string;
  concept: string;
  formulas: { latex: string; symbols: { name: string; meaning: string; unit: string }[]; when_to_use: string; derivation?: string; related?: string[] }[];
  practice: { difficulty: number; prompt: string; answer: string; prerequisites: string[] }[];
}[];

const db = new PrismaClient();

async function main() {
  for (const c of CURATED) {
    const subject = await db.subject.upsert({ where: { name: c.subject }, update: {}, create: { name: c.subject } });
    const topic = await db.topic.upsert({
      where: { subjectId_name: { subjectId: subject.id, name: c.topic } },
      update: {},
      create: { name: c.topic, subjectId: subject.id }
    });
    const subtopic = await db.subtopic.upsert({
      where: { topicId_name: { topicId: topic.id, name: c.subtopic } },
      update: { concept: c.concept },
      create: { name: c.subtopic, concept: c.concept, topicId: topic.id }
    });
    if ((await db.formula.count({ where: { subtopicId: subtopic.id } })) === 0) {
      for (const f of c.formulas) {
        await db.formula.create({
          data: {
            latex: f.latex,
            symbols: f.symbols,
            whenToUse: f.when_to_use,
            derivation: f.derivation ?? null,
            relatedIds: f.related ?? [],
            subtopicId: subtopic.id
          }
        });
      }
    }
    if ((await db.practiceQuestion.count({ where: { subtopicId: subtopic.id } })) === 0) {
      for (const q of c.practice) {
        await db.practiceQuestion.create({
          data: {
            promptLatex: q.prompt,
            difficulty: q.difficulty,
            prerequisites: q.prerequisites,
            answer: q.answer,
            subtopicId: subtopic.id
          }
        });
      }
    }
    if ((await db.section.count({ where: { topicId: topic.id } })) === 0) {
      const scope = [
        { title: `${c.subtopic} concept`, kind: "note", subtopicId: subtopic.id },
        { title: `${c.subtopic} formulas`, kind: "formula", subtopicId: subtopic.id },
        { title: "Practice set", kind: "practice", subtopicId: null as string | null }
      ];
      for (const [i, s] of scope.entries()) {
        await db.section.create({
          data: { topicId: topic.id, title: s.title, position: i + 1, kind: s.kind, subtopicId: s.subtopicId }
        });
      }
    }
    console.log(`Seeded ${c.subtopic}`);
  }
}

main().then(() => db.$disconnect());
