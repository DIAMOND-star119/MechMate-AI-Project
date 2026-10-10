import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/admin";

async function gate() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!(await isAdmin(session?.user?.id))) return null;
  return session;
}

export async function GET(req: Request) {
  if (!(await gate())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status");
  const alerts = await db.safetyAlert.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return NextResponse.json({ alerts });
}

export async function PATCH(req: Request) {
  if (!(await gate())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id, status } = (await req.json()) as { id?: string; status?: string };
  if (!id || !["reviewed", "dismissed", "escalated"].includes(status ?? "")) {
    return NextResponse.json({ error: "id + valid status required" }, { status: 400 });
  }
  const alert = await db.safetyAlert.update({ where: { id }, data: { status } });
  return NextResponse.json({ alert: { id: alert.id, status: alert.status } });
}
