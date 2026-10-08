import { Math } from "./Math";

export function SearchSubtopics() {
  return (
    <section className="mm-card">
      <div className="mm-eyebrow">PRD §6 — Topic discovery</div>
      <h2 className="text-lg font-bold">Search → Subtopics</h2>
      <input
        className="mt-3 w-full rounded-full border border-slate-200 px-4 py-3"
        defaultValue="Kinematics"
        aria-label="Search topics"
      />
      <p className="mt-3 flex gap-2 text-xs font-bold">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Recommended order</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Free explore</span>
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="rounded-lg border p-2.5"><b>1</b> Displacement</li>
        <li className="rounded-lg border p-2.5"><b>2</b> Velocity — next</li>
        <li className="rounded-lg border p-2.5"><b>3</b> Acceleration</li>
      </ul>
      <p className="mt-3 rounded-lg bg-amber-100 p-2.5 text-[13px] text-amber-900">
        ⚠ Projectile motion uses Velocity components. You can continue — quick refresh available in context.
      </p>
    </section>
  );
}

export function ConceptFormula() {
  return (
    <section className="mm-card">
      <div className="mm-eyebrow">PRD §7 — Concept + Formula</div>
      <h2 className="text-lg font-bold">Velocity</h2>
      <p className="mt-1 text-[15px]">Velocity is displacement per unit time, with direction.</p>
      <p className="mt-2"><Math tex="v = \frac{\Delta x}{\Delta t}" /></p>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="text-left text-slate-500"><th>Symbol</th><th>Meaning</th><th>Unit</th></tr></thead>
        <tbody>
          <tr className="border-t"><td><code>v</code></td><td>velocity</td><td>m/s</td></tr>
          <tr className="border-t"><td><code>Δx</code></td><td>displacement</td><td>m</td></tr>
          <tr className="border-t"><td><code>Δt</code></td><td>time interval</td><td>s</td></tr>
        </tbody>
      </table>
      <details className="mt-3 rounded-lg border p-2.5"><summary className="font-bold">What does it mean? When to use it?</summary>
        <p className="text-sm text-slate-600">Use when direction matters. Vector sign carries meaning.</p>
      </details>
    </section>
  );
}

export function ExamplesRefresher() {
  return (
    <section className="mm-card">
      <div className="mm-eyebrow">PRD §8 + §13 — Examples + Refresher</div>
      <h2 className="text-lg font-bold">Progressive examples</h2>
      <h3 className="mt-3 font-bold">Example 1 — Basic</h3>
      <p className="text-sm">Δx = 100 m, Δt = 20 s → <Math tex="v = 100/20 = 5\ \text{m/s}" /></p>
      <h3 className="mt-3 font-bold">Example 2 — Challenging</h3>
      <p className="text-sm">Return trip → displacement 0 → average velocity 0.</p>
      <div className="mt-3 rounded-lg border border-dashed border-indigo-500 bg-slate-50 p-3">
        <b>Quick refresh — Velocity components</b><br />
        <Math tex="v_x = u\cos\theta" /> &nbsp; <Math tex="v_y = u\sin\theta" />
      </div>
    </section>
  );
}

export function PracticeResults() {
  return (
    <section className="mm-card">
      <div className="mm-eyebrow">PRD §9–§11 — Practice / Results / Retest</div>
      <h2 className="text-lg font-bold">Practice (difficulty 2/3)</h2>
      <p className="text-sm">u = 20 m/s, θ = 30°. Find <Math tex="v_x" />.</p>
      <ul className="mt-2 space-y-2 text-sm">
        <li className="rounded-lg border p-2.5">A — 10.0 m/s</li>
        <li className="rounded-lg border p-2.5">B — 17.3 m/s</li>
        <li className="rounded-lg border p-2.5">C — 20.0 m/s</li>
      </ul>
      <p className="mt-3 text-sm"><b>2 / 3 correct.</b> Q2 answer: <Math tex="v_x = u\cos\theta = 17.3\ \text{m/s}" /></p>
      <p className="mt-2 rounded-lg bg-emerald-100 p-2 text-sm text-emerald-900">✓ Strength: Displacement & average velocity.</p>
    </section>
  );
}

export function QuestionProgress() {
  return (
    <section className="mm-card">
      <div className="mm-eyebrow">PRD §12 / §14 / §17 / §18</div>
      <h2 className="text-lg font-bold">Questions + Next</h2>
      <p className="text-sm"><b>Student:</b> Why is horizontal acceleration zero?</p>
      <p className="text-sm text-slate-600"><b>MechMate:</b> No horizontal force (ignoring air) → connects to vx = constant.</p>
      <p className="mt-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">Next: Acceleration →</span></p>
      <details className="mt-2 rounded-lg border p-2.5"><summary className="font-bold">Derivation? (optional)</summary>
        <p className="text-sm"><Math tex="v = u + at" /> from a = dv/dt.</p>
      </details>
    </section>
  );
}
