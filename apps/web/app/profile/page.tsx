import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../lib/auth";
import { Logo } from "../../components/Math";
import { ProfileClient } from "../../components/ProfileClient";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");
  const user = session.user as typeof session.user & { isAnonymous?: boolean; username?: string };
  if (user.isAnonymous) redirect("/");

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-7">
      <header className="mb-5 flex items-center gap-3">
        <Logo />
        <div>
          <p className="text-sm text-indigo-200"><Link href="/" className="underline">← Home</Link></p>
          <h1 className="text-2xl font-extrabold text-slate-50">Profile</h1>
        </div>
      </header>
      <ProfileClient username={user.username ?? user.name ?? null} email={user.email ?? null} />
    </main>
  );
}
