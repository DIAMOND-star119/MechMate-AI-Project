import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { getTopicState } from "../../../lib/topic-state";

// Dashboard rollup (brief §§3, 7). Per-topic state (sections, completed, mastered)
// comes from getTopicState: coverage derived from evidence, never clicks.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const topics = await db.topic.findMany({
    include: { subject: true, subtopics: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });

  if (!session?.user?.id) {
    return NextResponse.json({
      signedIn: false,
      catalogue: topics.map((t) => ({
        topic: t.name,
        subject: t.subject.name,
        subtopics: t.subtopics.map((s) => s.name)
      }))
    });
  }

  const uid = session.user.id;
  const [progress, recent, states] = await Promise.all([
    db.progress.findMany({ where: { userId: uid }, include: { subtopic: { select: { id: true, name: true, topicId: true } } } }),
    db.attempt.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { question: { select: { subtopic: { select: { name: true, topic: { select: { name: true } } } } } } }
    }),
    Promise.all(topics.map((t) => getTopicState(uid, t.id)))
  ]);

  const statusBySubtopic = new Map(progress.map((p) => [p.subtopic.topicId + ":" + p.subtopic.name, p.status]));
  const stateByTopic = new Map(states.map((s, i) => [topics[i].id, s]));
  const perTopic = topics.map((t) => {
    const st = stateByTopic.get(t.id)!;
    const struggling = t.subtopics.filter((s) => statusBySubtopic.get(t.id + ":" + s.name) === "struggling").map((s) => s.name);
    const studiedNames = new Set(progress.filter((p) => p.subtopic.topicId === t.id).map((p) => p.subtopic.name));
    const continueSubtopic = t.subtopics.find((s) => !studiedNames.has(s.name)) ?? t.subtopics[0];
    return {
      topic: t.name,
      subject: t.subject.name,
      totalSubtopics: t.subtopics.length,
      percent: st.sections.length ? Math.round((st.sections.filter((s) => s.covered).length / st.sections.length) * 100) : 0,
      sections: st.sections,
      completed: st.completed,
      mastered: st.mastered,
      attempts: st.attempts,
      struggling,
      started: st.sections.some((s) => s.covered),
      continueHref: continueSubtopic ? `/learn/${continueSubtopic.name.toLowerCase()}` : null
    };
  });

  const started = perTopic.filter((t) => t.started);
  const overall = perTopic.length
    ? Math.round(perTopic.reduce((a, t) => a + t.percent, 0) / perTopic.length)
    : 0;

  return NextResponse.json({
    signedIn: true,
    overall,
    topics: perTopic,
    current: started,
    recent: recent.map((a) => ({
      topic: a.question.subtopic.topic.name,
      subtopic: a.question.subtopic.name,
      correct: a.correct,
      at: a.createdAt
    })),
    remaining: perTopic.reduce((a, t) => a + t.sections.filter((s) => !s.covered).length, 0)
  });
}
