import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";

// Optional onboarding personalization (PRD §16): field + level only.
export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { field, level } = (await req.json()) as { field?: string; level?: string };
  const user = await db.user.update({ where: { id: uid }, data: { field: field ?? null, level: level ?? null } });
  return NextResponse.json({ field: user.field, level: user.level });
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ field: null, level: null });
  const user = await db.user.findUnique({ where: { id: uid }, select: { field: true, level: true } });
  return NextResponse.json({ field: user?.field ?? null, level: user?.level ?? null });
}
