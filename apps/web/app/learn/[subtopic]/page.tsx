import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubtopic } from "../../../lib/content";
import { db } from "../../../lib/db";
import { Math, Logo } from "../../../components/Math";
import { PracticeRunner } from "../../../components/PracticeRunner";
import { AskDrawer } from "../../../components/AskDrawer";
import { NextUp } from "../../../components/NextUp";
import { EndOfLesson } from "../../../components/EndOfLesson";
import { TopicExtras } from "../../../components/TopicExtras";

export default async function SubtopicPage({ params }: { params: Promise<{ subtopic: string }> }) {
  const { subtopic } = await params;
  // Route params arrive still URL-encoded when the name contains spaces
  // ("spring%20constant"): decode before every lookup, or every
  // multi-word lesson 404s even though its row exists.
  let slug = subtopic;
  try {
    slug = decodeURIComponent(subtopic);
  } catch {
    slug = subtopic;
  }
  let data = getSubtopic(slug);
  if (!data) {
    // AI-created subtopics live in Postgres, not the seed JSON.
    // A dead database must 404, never 500 the lesson.
    try {
      const row = await db.subtopic.findFirst({
        where: { name: { equals: slug, mode: "insensitive" } },
        include: { topic: { include: { subject: true } }, formulas: true, questions: true }
      });
      if (!row) notFound();
    data = {
      subject: row.topic.subject.name,
      topic: row.topic.name,
      subtopic: row.name,
      concept: row.concept,
      formulas: row.formulas.map((f) => ({
        id: f.id,
        latex: f.latex,
        symbols: (f.symbols as { name: string; meaning: string; unit: string }[]),
        when_to_use: f.whenToUse
      })),
      examples: [] as { level: "basic" | "challenging"; text: string; latex: string }[],
      practice: row.questions.map((q) => ({
        id: q.id,
        difficulty: q.difficulty,
        prompt: q.promptLatex,
        answer: q.answer,
        prerequisites: ((q.prerequisites as string[]) ?? [])
      }))
    };
    } catch {
      notFound();
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-7">
      <header className="mb-5 flex items-center gap-3">
        <Logo />
        <div>
          <p className="text-sm text-indigo-200"><Link href="/" className="underline">← Search</Link> · {data.subject} / {data.topic}</p>
          <h1 className="text-2xl font-extrabold text-slate-50">{data.subtopic}</h1>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="mm-card md:col-span-2">
          <TopicExtras subtopic={data.subtopic} />
        </section>
        <section className="mm-card">
          <div className="mm-eyebrow">Concept (§7.1)</div>
          <p className="text-[15px]">{data.concept}</p>
          <p className="mt-2 rounded-lg bg-amber-100 p-2.5 text-[13px] text-amber-900">
            ⚠ Assumes Displacement. You can continue — refresher appears in context, never blocks.
          </p>
        </section>

        <section className="mm-card">
          <div className="mm-eyebrow">Formulas (§7.2 / §7.3)</div>
          {data.formulas.map((f) => (
            <div key={f.id} className="mb-4">
              <p><Math tex={f.latex} /></p>
              <table className="mt-2 w-full text-sm">
                <thead><tr className="text-left text-slate-500"><th>Symbol</th><th>Meaning</th><th>Unit</th></tr></thead>
                <tbody>
                  {f.symbols.map((s) => (
                    <tr key={s.name} className="border-t"><td><code>{s.name}</code></td><td>{s.meaning}</td><td>{s.unit}</td></tr>
                  ))}
                </tbody>
              </table>
              <details className="mt-2 rounded-lg border p-2.5"><summary className="font-bold">When to use it?</summary>
                <p className="text-sm text-slate-600">{f.when_to_use}</p>
              </details>
            </div>
          ))}
        </section>

        <section className="mm-card">
          <div className="mm-eyebrow">Examples (§8 — basic → challenging)</div>
          {data.examples.length === 0 && (
            <p className="text-sm text-slate-500">Worked examples for this AI-built subtopic are on the way — ask the companion for one meanwhile.</p>
          )}
          {data.examples.map((e) => (
            <div key={e.level} className="mb-3">
              <h3 className="font-bold capitalize">{e.level}</h3>
              <p className="text-sm">{e.text}</p>
              <p className="text-sm"><Math tex={e.latex} /></p>
            </div>
          ))}
        </section>

        <section className="mm-card">
          <div className="mm-eyebrow">Practice → Results → Retest (§§9–11)</div>
          <PracticeRunner items={data.practice} subtopic={data.subtopic} />
        </section>

        <section className="mm-card">
          <div className="mm-eyebrow">Ask (§14 — answered + connected)</div>
          <AskDrawer subtopicId={data.subtopic} formulaId={data.formulas[0]?.id} />
        </section>

        <section className="mm-card">
          <div className="mm-eyebrow">Apply (§18 — optional)</div>
          <EndOfLesson formulaLatex={data.formulas[0]?.latex ?? ""} application={data.examples[0]?.text ?? ""} />
        </section>

        <section className="mm-card">
          <div className="mm-eyebrow">Next (§12 + §15)</div>
          <NextUp />
        </section>
      </div>
    </main>
  );
}
