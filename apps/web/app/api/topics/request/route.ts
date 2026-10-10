import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ai } from "../../../../lib/ai";
import { auth } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { research } from "../../../../lib/research";
import { classify, refusalText, recordAlert } from "../../../../lib/moderate";

// "Teach me X" (brief §§4, 17–21): draft scope with the model, ground with web
// sources, validate structure, persist as origin:'ai' content. Thin or missing
// evidence yields an honest unvalidated/unknown state — never fake certainty.
export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  const clean = (text ?? "").trim().slice(0, 200);
  if (!clean) return NextResponse.json({ error: "text required" }, { status: 400 });

  const mod = classify(clean);
  if (mod.level !== "normal") {
    if (mod.level === "serious") {
      const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
      await recordAlert({
        userId: session?.user?.id ?? "guest",
        category: mod.category ?? "serious",
        request: clean,
        messages: [],
        action: "refused"
      }).catch(() => {});
    }
    return NextResponse.json({ status: "refused", text: refusalText(mod.level, mod.category) });
  }

  const [draftResult, grounded] = await Promise.allSettled([
    ai.draftTopic(clean),
    research(clean)
  ]);
  const sources = grounded.status === "fulfilled" ? grounded.value.sources : [];
  const coverage = grounded.status === "fulfilled" ? grounded.value.coverage : "none";

  if (draftResult.status === "rejected") {
    return NextResponse.json({
      status: "unknown",
      text: "I couldn't confidently build that topic — no model answered and the web gave nothing solid. Try rephrasing, or come back with a source and I'll work from it.",
      sources: []
    });
  }

  const draft = draftResult.value;
  const validated = coverage !== "none";
  const subject = await db.subject.upsert({ where: { name: draft.subject }, update: {}, create: { name: draft.subject } });
  const existing = await db.topic.findUnique({ where: { subjectId_name: { subjectId: subject.id, name: draft.topic } } });
  const topic = existing ?? (await db.topic.create({
    data: { name: draft.topic, subjectId: subject.id, origin: "ai", validationStatus: validated ? "validated" : "unvalidated" }
  }));
  await db.section.deleteMany({ where: { topicId: topic.id } });
  for (const [i, s] of draft.scope.entries()) {
    await db.section.create({
      data: { topicId: topic.id, title: s.title.slice(0, 120), position: i + 1, kind: ["note", "formula", "example", "practice"].includes(s.kind) ? s.kind : "note", subtopicId: null }
    });
  }
  const subs = [];
  for (const st of draft.subtopics) {
    const sub = await db.subtopic.upsert({
      where: { topicId_name: { topicId: topic.id, name: st.name.slice(0, 120) } },
      update: { concept: st.concept.slice(0, 1000) },
      create: { name: st.name.slice(0, 120), concept: st.concept.slice(0, 1000), topicId: topic.id }
    });
    subs.push(sub);
  }
  await db.source.deleteMany({ where: { topicId: topic.id } });
  for (const s of sources.slice(0, 6)) {
    await db.source.create({ data: { topicId: topic.id, title: s.title.slice(0, 200), url: s.url.slice(0, 500), tier: s.tier, excerpt: s.excerpt } });
  }

  return NextResponse.json({
    status: validated ? "ready" : "unvalidated",
    topic: draft.topic,
    subject: draft.subject,
    href: subs[0] ? `/learn/${subs[0].name.toLowerCase()}` : null,
    notice: validated
      ? coverage === "thin"
        ? "Limited sources found — treat details as provisional and check the linked sources."
        : null
      : "Built without solid sources — marked unvalidated. It won't count toward completion until validated.",
    sources: sources.slice(0, 6).map((s) => ({ title: s.title, url: s.url, tier: s.tier }))
  });
}
