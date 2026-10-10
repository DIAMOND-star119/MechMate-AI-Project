// Guardrailed AI layer (brief §§9, 17, 30–31). Provider order: Groq (cloud, needs
// GROQ_API_KEY) → Ollama (local) → curated fallback at the call site.
// System stance: learning-first, educational scope, academic integrity (teach how,
// never complete work for the student), $...$ math delimiters. The key is only
// ever read from env server-side and never logged.

export interface AIContext {
  subtopicId: string;
  formulaId?: string;
}

export interface AIProvider {
  readonly id: string;
  explainConcept(concept: string, ctx: AIContext): Promise<string>;
  expandFormula(formulaLatex: string, ctx: AIContext): Promise<string>;
  answerQuestion(question: string, ctx: AIContext): Promise<string>;
  refresher(concept: string, ctx: AIContext): Promise<string>;
  draftTopic(request: string): Promise<TopicDraft>;
}

export interface TopicDraft {
  subject: string;
  topic: string;
  scope: { title: string; kind: string }[];
  subtopics: { name: string; concept: string }[];
}

const SYSTEM = `You are MechMate AI, a learning companion. Teach, don't just answer.
Rules: be concise by default; cite the current formula/subtopic; end Q&A with a one-line connection to the current formula. Write ALL math in $...$ delimiters (never bare LaTeX).
Scope: only answer what serves the student's learning. Refuse unrelated or disallowed requests briefly and redirect to the lesson.
Integrity: teach HOW to solve problems step by step; never just hand over completed academic work.`;

export class OllamaProvider implements AIProvider {
  readonly id: string = "ollama";
  constructor(
    private host = process.env.OLLAMA_HOST ?? "http://localhost:11434",
    private model = process.env.OLLAMA_MODEL ?? "llama3.1:8b"
  ) {}

  protected async generate(prompt: string): Promise<string> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt: `${SYSTEM}\n\n${prompt}`, stream: false })
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = (await res.json()) as { response?: string };
    if (!data.response) throw new Error("Ollama empty response");
    return data.response;
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
  async draftTopic(request: string): Promise<TopicDraft> {
    const raw = await this.generate(
      `A student asks: "Teach me ${request}". Reply with ONLY JSON (no prose): {"subject": "...", "topic": "...", "scope": [{"title": "...", "kind": "note|formula|example|practice"}], "subtopics": [{"name": "...", "concept": "one sentence"}]}. Keep 3-6 scope items and 1-4 subtopics.`
    );
    return parseDraft(raw);
  }
}

export class GroqProvider extends OllamaProvider {
  readonly id = "groq";
  private groqKey: string;
  private groqModel: string;
  constructor(apiKey = process.env.GROQ_API_KEY ?? "", model = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b") {
    super();
    if (!apiKey) throw new Error("GROQ_API_KEY missing");
    this.groqKey = apiKey;
    this.groqModel = model;
  }

  protected async generate(prompt: string): Promise<string> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.groqKey}` },
      body: JSON.stringify({
        model: this.groqModel,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 800
      })
    });
    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Groq empty response");
    return text;
  }
}

function parseDraft(raw: string): TopicDraft {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Draft not JSON");
  const d = JSON.parse(raw.slice(start, end + 1)) as TopicDraft;
  if (!d.topic || !d.subject || !Array.isArray(d.subtopics) || d.subtopics.length === 0) {
    throw new Error("Draft incomplete");
  }
  return d;
}

function pickProvider(): AIProvider {
  if (process.env.GROQ_API_KEY) {
    try {
      return new GroqProvider();
    } catch {
      /* fall through */
    }
  }
  return new OllamaProvider();
}

export const ai: AIProvider = pickProvider();
export const aiProviderId: string = ai.id;
