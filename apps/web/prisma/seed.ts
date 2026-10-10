import { PrismaClient } from "@prisma/client";
import velocity from "../../../content/kinematics/velocity.json";

const db = new PrismaClient();

async function main() {
  const subject = await db.subject.upsert({ where: { name: velocity.subject }, update: {}, create: { name: velocity.subject } });
  const topic = await db.topic.upsert({
    where: { subjectId_name: { subjectId: subject.id, name: velocity.topic } },
    update: {},
    create: { name: velocity.topic, subjectId: subject.id }
  });
  const subtopic = await db.subtopic.upsert({
    where: { topicId_name: { topicId: topic.id, name: velocity.subtopic } },
    update: { concept: velocity.concept },
    create: { name: velocity.subtopic, concept: velocity.concept, topicId: topic.id }
  });
  await db.formula.deleteMany({ where: { subtopicId: subtopic.id } });
  for (const f of velocity.formulas) {
    await db.formula.create({
      data: {
        latex: f.latex,
        symbols: f.symbols,
        whenToUse: f.when_to_use,
        derivation: (f as { derivation?: string }).derivation ?? null,
        relatedIds: (f as { related?: string[] }).related ?? [],
        subtopicId: subtopic.id
      }
    });
  }
  await db.practiceQuestion.deleteMany({ where: { subtopicId: subtopic.id } });
  for (const q of velocity.practice) {
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
  // Defined learning scope for the topic (brief §5): content rows, seeded.
  const scope = [
    { title: "Velocity concept", kind: "note", subtopic: true },
    { title: "Velocity formulas", kind: "formula", subtopic: true },
    { title: "Worked examples", kind: "example", subtopic: true },
    { title: "Practice set", kind: "practice", subtopic: false }
  ];
  await db.section.deleteMany({ where: { topicId: topic.id } });
  for (const [i, s] of scope.entries()) {
    await db.section.create({
      data: { topicId: topic.id, title: s.title, position: i + 1, kind: s.kind, subtopicId: s.subtopic ? subtopic.id : null }
    });
  }
  console.log(`Seeded ${velocity.subtopic} + ${velocity.formulas.length} formulas + ${velocity.practice.length} questions`);
}

main().then(() => db.$disconnect());
