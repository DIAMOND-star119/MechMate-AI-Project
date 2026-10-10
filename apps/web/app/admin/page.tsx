import Link from "next/link";
import { Logo } from "../../components/Math";
import { AdminAlerts } from "../../components/AdminAlerts";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-7">
      <header className="mb-5 flex items-center gap-3">
        <Logo />
        <div>
          <p className="text-sm text-indigo-200"><Link href="/" className="underline">← Home</Link></p>
          <h1 className="text-2xl font-extrabold text-slate-50">Safety alerts</h1>
        </div>
      </header>
      <section className="mm-card">
        <AdminAlerts />
      </section>
      <p className="mt-3 text-xs text-indigo-200">Alerts carry the minimum necessary data. Moderation is disclosed in Profile → Privacy.</p>
    </main>
  );
}
