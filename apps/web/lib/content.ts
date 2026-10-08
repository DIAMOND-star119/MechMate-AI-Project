import velocity from "../../../content/kinematics/velocity.json";

export interface SymbolDef {
  name: string;
  meaning: string;
  unit: string;
}

export interface Formula {
  id: string;
  latex: string;
  symbols: SymbolDef[];
  when_to_use: string;
  derivation?: string;
  related?: string[];
}

export interface Example {
  level: "basic" | "challenging";
  text: string;
  latex: string;
}

export interface Subtopic {
  subtopic: string;
  topic: string;
  subject: string;
  concept: string;
  formulas: Formula[];
  examples: Example[];
  practice: { id: string; difficulty: number; prompt: string; answer: string; prerequisites: string[] }[];
}

const SUBTOPICS: Subtopic[] = [velocity as Subtopic];

export function listSubtopics(): Pick<Subtopic, "subtopic" | "topic" | "subject">[] {
  return SUBTOPICS.map((s) => ({ subtopic: s.subtopic, topic: s.topic, subject: s.subject }));
}

export function getSubtopic(name: string): Subtopic | undefined {
  return SUBTOPICS.find((s) => s.subtopic.toLowerCase() === name.toLowerCase());
}

export function searchSubtopics(query: string): Subtopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return SUBTOPICS;
  return SUBTOPICS.filter((s) =>
    [s.subtopic, s.topic, s.subject, s.concept].some((f) => f.toLowerCase().includes(q))
  );
}
