import { Logo } from "../components/Math";
import { SearchBox } from "../components/SearchBox";
import { AuthBar } from "../components/AuthBar";
import { OnboardingForm } from "../components/OnboardingForm";
import { ConceptFormula, ExamplesRefresher, PracticeResults, QuestionProgress } from "../components/cards";

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
        <SearchBox />
        <OnboardingForm />
        <ConceptFormula />
        <ExamplesRefresher />
        <PracticeResults />
        <QuestionProgress />
      </div>
      <footer className="mt-6 text-[13px] text-indigo-200">
        MechMate AI MVP — Search → Learn → Practice → Retest. Concise by default.
      </footer>
    </main>
  );
}
