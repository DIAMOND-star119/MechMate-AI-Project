import Link from "next/link";
import { Logo } from "../components/Math";
import { SearchBox } from "../components/SearchBox";
import { AuthBar } from "../components/AuthBar";
import { OnboardingForm } from "../components/OnboardingForm";
import { Dashboard } from "../components/Dashboard";
import { RequestTopic } from "../components/RequestTopic";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-7">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-50">MechMate AI</h1>
            <p className="text-sm text-indigo-200">Search a topic. Understand the formulas. Apply them.</p>
          </div>
        </div>
        <AuthBar />
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Dashboard />
        <SearchBox />
        <section className="mm-card">
          <div className="mm-eyebrow">Can&apos;t find your topic? Just ask.</div>
          <RequestTopic />
        </section>
        <OnboardingForm />
        <section className="mm-card">
          <div className="mm-eyebrow">Study with the companion</div>
          <p className="text-sm text-slate-600">Conversational teaching, questions, and re-explanations.</p>
          <Link className="mt-2 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" href="/companion">
            Open AI companion →
          </Link>
        </section>
      </div>
      <footer className="mt-6 text-[13px] text-indigo-200">
        Learn → Apply → Practise → Assess → Correct → Retest or Progress.
      </footer>
    </main>
  );
}
