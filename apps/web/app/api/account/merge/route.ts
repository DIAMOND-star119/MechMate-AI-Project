import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

// Guest → account upgrade: move anonymous learning rows to the new account.
// Only rows belonging to an isAnonymous user can be claimed.
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { anonymousId } = (await req.json()) as { anonymousId?: string };
  if (!anonymousId || anonymousId === uid) return NextResponse.json({ error: "anonymousId required" }, { status: 400 });
  const anon = await db.user.findUnique({ where: { id: anonymousId }, select: { id: true, isAnonymous: true } });
  if (!anon?.isAnonymous) return NextResponse.json({ error: "only anonymous progress can be claimed" }, { status: 403 });
  await db.$transaction([
    db.attempt.updateMany({ where: { userId: anonymousId }, data: { userId: uid } }),
    db.progress.updateMany({ where: { userId: anonymousId }, data: { userId: uid } }),
    db.session.deleteMany({ where: { userId: anonymousId } }),
    db.account.deleteMany({ where: { userId: anonymousId } }),
    db.user.delete({ where: { id: anonymousId } })
  ]);
  return NextResponse.json({ ok: true });
}
