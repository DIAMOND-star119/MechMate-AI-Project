import { NextResponse } from "next/server";

// MVP sink: structured server log. A warehouse table lands post-MVP.
export async function POST(req: Request) {
  try {
    const event = await req.json();
    console.log(JSON.stringify({ scope: "mechmate-analytics", event }));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
