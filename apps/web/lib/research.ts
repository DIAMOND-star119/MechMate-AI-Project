// Web grounding (brief §§17–21). No new keys required: Wikipedia/Wikibooks API
// plus optional Brave Search when BRAVE_API_KEY is set. Only the topic text is
// ever sent out — never personal or progress data (§21). Copyright: synthesize,
// short quotes only, always link sources.

export type Tier = 1 | 2 | 3;

export interface Source {
  title: string;
  url: string;
  tier: Tier;
  excerpt: string;
}

export interface Research {
  sources: Source[];
  coverage: "good" | "thin" | "none";
}

function tierFor(url: string): Tier {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.endsWith(".edu") || host.endsWith(".gov") || host.includes("nist.") || host.includes("ieee.") || host.includes("asme.")) return 1;
    if (host.includes("wikipedia.") || host.includes("wikibooks.") || host.includes("khanacademy.") || host.includes("mit.edu") || host.includes("openstax.")) return 2;
  } catch { /* ignore */ }
  return 3;
}

async function wiki(topic: string): Promise<Source[]> {
  const q = encodeURIComponent(topic);
  const search = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${q}&limit=3&format=json`, {
    headers: { "User-Agent": "MechMateAI/0.1 (learning app)" }
  });
  if (!search.ok) return [];
  const [, titles, , urls] = (await search.json()) as [string, string[], string[], string[]];
  const out: Source[] = [];
  for (let i = 0; i < titles.length; i++) {
    try {
      const sum = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[i])}`,
        { headers: { "User-Agent": "MechMateAI/0.1 (learning app)" } }
      );
      if (!sum.ok) continue;
      const s = (await sum.json()) as { extract?: string };
      out.push({ title: titles[i], url: urls[i] ?? "", tier: 2, excerpt: (s.extract ?? "").slice(0, 400) });
    } catch { /* next */ }
  }
  return out;
}

async function brave(topic: string): Promise<Source[]> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(topic + " physics explanation")}&count=5`, {
      headers: { "X-Subscription-Token": key }
    });
    if (!res.ok) return [];
    const d = (await res.json()) as { web?: { results?: { title?: string; url?: string; description?: string }[] } };
    return (d.web?.results ?? []).slice(0, 5).map((r) => ({
      title: r.title ?? r.url ?? "source",
      url: r.url ?? "",
      tier: tierFor(r.url ?? ""),
      excerpt: (r.description ?? "").slice(0, 400)
    }));
  } catch {
    return [];
  }
}

// Only the topic keywords ever leave the machine — strip conversational
// wrappers so "Teach me X?" searches as "X", and cap length.
function toQuery(topic: string): string {
  return topic
    .replace(/^(please\s+)?(teach me|explain|learn|tell me about|what is|what are|how (does|do))\s+/i, "")
    .replace(/[?.!]+$/, "")
    .trim()
    .slice(0, 120);
}

export async function research(topic: string): Promise<Research> {
  const clean = toQuery(topic);
  if (!clean) return { sources: [], coverage: "none" };
  const [w, b] = await Promise.all([wiki(clean).catch(() => [] as Source[]), brave(clean).catch(() => [] as Source[])]);
  const seen = new Set<string>();
  const sources = [...b, ...w].filter((s) => s.url && !seen.has(s.url) && (seen.add(s.url), true));
  return {
    sources,
    coverage: sources.length >= 2 ? "good" : sources.length === 1 ? "thin" : "none"
  };
}
