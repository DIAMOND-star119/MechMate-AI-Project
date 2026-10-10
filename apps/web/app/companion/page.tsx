import Link from "next/link";
import { Logo } from "../../components/Math";
import { CompanionPreview } from "../../components/CompanionPreview";
import { listSubtopics } from "../../lib/content";

export default async function CompanionPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const topics = listSubtopics();
  const initial = topics.some((t) => t.subtopic.toLowerCase() === (topic ?? "").toLowerCase()) ? topic! : undefined;
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-7">
      <header className="mb-5 flex items-center gap-3">
        <Logo />
        <div>
          <p className="text-sm text-indigo-200"><Link href="/" className="underline">← Home</Link></p>
          <h1 className="text-2xl font-extrabold text-slate-50">AI Study Mode</h1>
        </div>
      </header>
      <section className="mm-card">
        <CompanionPreview topics={topics} initial={initial} />
      </section>
      <p className="mt-3 text-xs text-indigo-200">Shares progress with Study Mode. Answers are curated until a model is installed.</p>
    </main>
  );
}
