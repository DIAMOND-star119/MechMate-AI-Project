import displacement from "../../../content/kinematics/displacement.json";
import velocity from "../../../content/kinematics/velocity.json";
import acceleration from "../../../content/kinematics/acceleration.json";
import equationsOfMotion from "../../../content/kinematics/equations-of-motion.json";
import projectileMotion from "../../../content/kinematics/projectile-motion.json";
import nuclearDecayModes from "../../../content/radioactivity/nuclear-decay-modes.json";

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

// Natural learning order: position → velocity → acceleration → the
// equations that bind them → two-dimensional motion.
const SUBTOPICS: Subtopic[] = [
  displacement as Subtopic,
  velocity as Subtopic,
  acceleration as Subtopic,
  equationsOfMotion as Subtopic,
  projectileMotion as Subtopic,
  nuclearDecayModes as Subtopic
];

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
