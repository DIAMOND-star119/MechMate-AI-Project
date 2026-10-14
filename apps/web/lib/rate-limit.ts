// Lightweight per-IP rate limiting for AI-costly endpoints (abuse guard,
// not a security boundary). NOTE: state is per serverless instance — behind
// many instances a determined caller gets limit × instances. Good enough to
// stop accidental loops and casual abuse; use a shared store if abuse grows.
const buckets = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 80);
  return (req.headers.get("x-real-ip") ?? "local").slice(0, 80);
}

// Returns true when the call is allowed (and records it).
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}
