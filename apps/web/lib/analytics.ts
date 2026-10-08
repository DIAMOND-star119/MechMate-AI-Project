// Minimal MVP analytics (PRD §22 proxy): completion, retest pass,
// time-to-apply. Client buffers to localStorage; POSTs best-effort.

export type AnalyticsEvent =
  | { name: "practice_complete"; subtopic: string; score: number; total: number }
  | { name: "retest_pass"; subtopic: string }
  | { name: "lesson_complete"; subtopic: string; seconds: number };

export function track(e: AnalyticsEvent) {
  try {
    const key = "mechmate-events";
    const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
    localStorage.setItem(key, JSON.stringify([...prev, { ...e, at: new Date().toISOString() }]));
  } catch { /* private mode — ignore */ }
  fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) })
    .catch(() => {});
}
