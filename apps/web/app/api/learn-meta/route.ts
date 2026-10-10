import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

// Topic extras for a subtopic page: origin/validation badge, grounded sources,
// and the Study ↔ AI-Study mode links (both modes share progress).
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("subtopic") ?? "";
  const sub = await db.subtopic.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    include: { topic: { include: { sources: true } } }
  });
  if (!sub) return NextResponse.json({ sources: [], origin: "curated", validationStatus: "validated", topic: null });
  return NextResponse.json({
    topic: sub.topic.name,
    origin: sub.topic.origin,
    validationStatus: sub.topic.validationStatus,
    sources: sub.topic.sources.map((s) => ({ title: s.title, url: s.url, tier: s.tier }))
  });
}
