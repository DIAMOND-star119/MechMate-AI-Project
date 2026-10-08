// Guardrailed AI layer (PRD §§7,13,14,17). Provider interface keeps the
// default local Ollama swappable with a cloud provider later without
// changing call sites. All prompts must cite the current formula/subtopic
// and enforce "understanding before answers".

export interface AIContext {
  subtopicId: string;
  formulaId?: string;
}

export interface AIProvider {
  explainConcept(concept: string, ctx: AIContext): Promise<string>;
  expandFormula(formulaLatex: string, ctx: AIContext): Promise<string>;
  answerQuestion(question: string, ctx: AIContext): Promise<string>;
  refresher(concept: string, ctx: AIContext): Promise<string>;
}

const SYSTEM = `You are MechMate AI, a learning companion. Teach, don't just answer.
Rules: be concise by default; cite the current formula/subtopic; end Q&A with a one-line connection to the current formula.`;

export class OllamaProvider implements AIProvider {
  constructor(
    private host = process.env.OLLAMA_HOST ?? "http://localhost:11434",
    private model = process.env.OLLAMA_MODEL ?? "llama3.1:8b"
  ) {}

  private async generate(prompt: string): Promise<string> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt: `${SYSTEM}\n\n${prompt}`, stream: false })
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = (await res.json()) as { response?: string };
    return data.response ?? "";
  }

  explainConcept(concept: string, ctx: AIContext) {
    return this.generate(`Explain this concept concisely (subtopic ${ctx.subtopicId}): ${concept}`);
  }
  expandFormula(formulaLatex: string, ctx: AIContext) {
    return this.generate(`Explain what this formula means and when to use it (${formulaLatex}) in subtopic ${ctx.subtopicId}.`);
  }
  answerQuestion(question: string, ctx: AIContext) {
    return this.generate(`Answer exactly: ${question}. Then add one line connecting it to subtopic ${ctx.subtopicId}${ctx.formulaId ? `, formula ${ctx.formulaId}` : ""}.`);
  }
  refresher(concept: string, ctx: AIContext) {
    return this.generate(`Give a 2-line refresher on ${concept} needed for subtopic ${ctx.subtopicId}, then say "back to the question".`);
  }
}

export const ai: AIProvider = new OllamaProvider();
