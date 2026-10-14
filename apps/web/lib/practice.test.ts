import { describe, expect, it } from "vitest";
import { answersMatch, nextLevel, summarize, sortByDifficulty } from "./practice";

describe("answersMatch (fair numeric grading)", () => {
  it("exact match passes", () => {
    expect(answersMatch("5 m/s", "5 m/s")).toBe(true);
  });
  it("equivalent numeric forms pass within tolerance", () => {
    expect(answersMatch("17.32 m/s", "17.3 m/s")).toBe(true);
    expect(answersMatch("5m/s", "5 m/s")).toBe(true);
    expect(answersMatch("5", "5 m/s")).toBe(true); // omitted unit passes
  });
  it("wrong values fail", () => {
    expect(answersMatch("6 m/s", "5 m/s")).toBe(false);
    expect(answersMatch("hello", "5 m/s")).toBe(false);
  });
  it("conflicting units fail", () => {
    expect(answersMatch("5 m", "5 s")).toBe(false);
  });
  it("negative values work", () => {
    expect(answersMatch("-65 m", "-65 m")).toBe(true);
    expect(answersMatch("-3 m/s²", "-3 m/s²")).toBe(true);
  });
});

describe("nextLevel (adaptive rule)", () => {
  it("steps up after 2 consecutive correct", () => {
    expect(nextLevel(1, 2, true, 3)).toBe(2);
  });
  it("holds below streak", () => {
    expect(nextLevel(1, 1, true, 3)).toBe(1);
  });
  it("steps down on miss, never below 1", () => {
    expect(nextLevel(2, 0, false, 3)).toBe(1);
    expect(nextLevel(1, 0, false, 3)).toBe(1);
  });
  it("never exceeds max", () => {
    expect(nextLevel(3, 5, true, 3)).toBe(3);
  });
});

describe("summarize", () => {
  it("scores and collects missed + strengths", () => {
    const s = summarize([
      { id: "a", correct: true, prerequisites: ["F1"], answer: "1", given: "1" },
      { id: "b", correct: false, prerequisites: ["F2"], answer: "2", given: "3" }
    ]);
    expect(s.score).toBe(1);
    expect(s.total).toBe(2);
    expect(s.missed.map((m) => m.id)).toEqual(["b"]);
    expect(s.strengths).toEqual(["F1"]);
  });
});

describe("sortByDifficulty", () => {
  it("orders ascending without mutating", () => {
    const items = [
      { id: "c", difficulty: 3, prompt: "c", answer: "c", prerequisites: [] as string[] },
      { id: "a", difficulty: 1, prompt: "a", answer: "a", prerequisites: [] as string[] }
    ];
    expect(sortByDifficulty(items).map((i) => i.id)).toEqual(["a", "c"]);
    expect(items[0].id).toBe("c");
  });
});
