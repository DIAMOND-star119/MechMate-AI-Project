import { db } from "./db";

// Three-level moderation (brief §§27–28). NORMAL answers; RESTRICTED refuses and
// redirects with no alert; SERIOUS refuses/blocks and files a silent, minimal
// alert for admin review. Silent = no user-facing disruption beyond the refusal.

export type ModLevel = "normal" | "restricted" | "serious";

const SERIOUS: { category: string; patterns: RegExp[] }[] = [
  { category: "self-harm", patterns: [/suicid/i, /kill myself/i, /self[- ]?harm/i, /end my life/i] },
  { category: "weapons", patterns: [/build (a |an )?(bomb|gun|missile|nuke|explosive)/i, /how to make (a )?(bomb|explosive|napalm)/i, /3d.print.*(gun|firearm)/i] },
  { category: "cyberattack", patterns: [/ransomware/i, /ddos attack/i, /hack into/i, /steal (someone's|credentials|passwords)/i, /write malware/i] },
  { category: "csam", patterns: [/child.*(sexual|porn|explicit)/i, /minor.*(sexual|explicit)/i] },
  { category: "viol wrongdoing", patterns: [/how to (murder|assault|kidnap|poison)/i, /make (someone|them) (sick|die)/i] }
];

const RESTRICTED: { category: string; patterns: RegExp[] }[] = [
  { category: "off-topic", patterns: [/betting odds/i, /cura.{0,3}cao/i, /lottery numbers/i, /who will win the (match|election)/i, /write me a (love|dating)/i] },
  { category: "academic-dishonesty", patterns: [/do my (homework|assignment|exam|test) for me/i, /write my (essay|thesis|lab report)( for me)?$/i, /answer these exam questions.*for me/i, /take my (exam|test) for me/i] }
];

export function classify(text: string): { level: ModLevel; category: string | null } {
  for (const g of SERIOUS) if (g.patterns.some((p) => p.test(text))) return { level: "serious", category: g.category };
  for (const g of RESTRICTED) if (g.patterns.some((p) => p.test(text))) return { level: "restricted", category: g.category };
  return { level: "normal", category: null };
}

export function refusalText(level: ModLevel, category: string | null): string {
  if (level === "serious") return "I can't help with that. If you're struggling, please reach out to someone you trust or a local support service — let's get back to your studies when you're ready.";
  if (category === "academic-dishonesty") {
    return "I won't complete the work for you — but I'll teach you how. Tell me which part you're stuck on and we'll solve one step together.";
  }
  return "That's outside what I'm here to teach. Ask me about the concept or formula you're studying and I'll connect it back.";
}

export async function recordAlert(input: {
  userId: string;
  category: string;
  request: string;
  messages: { role: string; text: string }[];
  action: string;
}) {
  const messages = input.messages.slice(-5).map((m) => ({ role: m.role, text: m.text.slice(0, 500) }));
  await db.safetyAlert.create({
    data: { userId: input.userId, category: input.category, request: input.request.slice(0, 1000), messages, action: input.action, status: "open" }
  });
}
