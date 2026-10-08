"use client";

import { useState } from "react";
import { Math } from "./Math";

// End-of-lesson application (PRD §18): formula + application side by side,
// only when the student opts in.
export function EndOfLesson({ formulaLatex, application }: { formulaLatex: string; application: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white" onClick={() => setOpen(true)}>
        See how these formulas are applied?
      </button>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg bg-slate-50 p-3"><div className="mm-eyebrow">Formula</div><Math tex={formulaLatex} /></div>
      <div className="rounded-lg bg-slate-50 p-3"><div className="mm-eyebrow">Application</div><p className="text-sm">{application}</p></div>
    </div>
  );
}
