"use client";

export default function SubtopicError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-7">
      <div className="mm-card">
        <h1 className="text-lg font-bold">Something went wrong loading this lesson.</h1>
        <p className="mt-1 text-sm text-slate-600">Your progress is saved. Try again — if it persists, the curated content still works offline.</p>
        <button className="mt-3 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
