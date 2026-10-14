import { describe, expect, it } from "vitest";
import { getSubtopic, listSubtopics, searchSubtopics } from "./content";

// The curated catalogue is the offline backbone: every entry must be a
// complete, gradable lesson, or the learn page shows empty shells.
describe("curated catalogue", () => {
  it("has more than a single lesson and unique names", () => {
    const all = listSubtopics();
    expect(all.length).toBeGreaterThan(1);
    const names = all.map((s) => s.subtopic.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("every lesson resolves with formulas, examples, and practice", () => {
    for (const { subtopic } of listSubtopics()) {
      const s = getSubtopic(subtopic);
      expect(s, subtopic).toBeDefined();
      expect(s!.concept.length).toBeGreaterThan(20);
      expect(s!.formulas.length).toBeGreaterThanOrEqual(2);
      expect(s!.practice.length).toBeGreaterThanOrEqual(4);
      for (const q of s!.practice) {
        // Gradable: single numeric answer with a unit.
        expect(q.answer, `${subtopic}/${q.id}`).toMatch(/-?\d+(?:\.\d+)?/);
        expect([1, 2, 3]).toContain(q.difficulty);
      }
      for (const f of s!.formulas) {
        expect(f.latex.length).toBeGreaterThan(0);
        expect(f.symbols.length).toBeGreaterThan(0);
      }
    }
  });

  it("search finds lessons case-insensitively", () => {
    expect(searchSubtopics("VELOCITY").length).toBeGreaterThan(0);
    expect(searchSubtopics("projectile").length).toBeGreaterThan(0);
  });

  it("multi-word lessons resolve (lesson-link regression)", () => {
    expect(getSubtopic("nuclear decay modes")).toBeDefined();
    expect(getSubtopic("equations of motion")).toBeDefined();
  });
});
