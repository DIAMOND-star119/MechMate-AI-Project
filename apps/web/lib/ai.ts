// Guardrailed AI layer (brief §§9, 17, 30–31). Provider order: Groq (cloud, needs
// GROQ_API_KEY) → Ollama (local) → curated fallback at the call site.
// System stance: learning-first, educational scope, academic integrity (teach how,
// never complete work for the student), $...$ math delimiters. The key is only
// ever read from env server-side and never logged.

export interface AIContext {
  subtopicId: string;
  formulaId?: string;
}

export interface ChatHistory {
  role: string;
  text: string;
}

export interface AIProvider {
  readonly id: string;
  explainConcept(concept: string, ctx: AIContext): Promise<string>;
  expandFormula(formulaLatex: string, ctx: AIContext): Promise<string>;
  answerQuestion(question: string, ctx: AIContext, history?: ChatHistory[]): Promise<string>;
  refresher(concept: string, ctx: AIContext): Promise<string>;
  draftTopic(request: string): Promise<TopicDraft>;
  makeTitle(texts: string[]): Promise<string>;
  draftLesson(subtopic: string, concept: string, topic: string): Promise<LessonDraft>;
}

export interface TopicDraft {
  subject: string;
  topic: string;
  scope: { title: string; kind: string }[];
  subtopics: { name: string; concept: string }[];
}

// Teachable lesson content for ONE subtopic: formulas plus auto-graded
// practice. Answers must be a single number with a unit (e.g. "5 m/s") so
// the tolerance grader accepts equivalent forms ("5.0 m/s", "5m/s").
export interface LessonDraft {
  formulas: {
    latex: string;
    symbols: { name: string; meaning: string; unit: string }[];
    when_to_use: string;
  }[];
  practice: { difficulty: number; prompt: string; answer: string }[];
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

  protected async generate(prompt: string, maxTokens?: number): Promise<string> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: `${SYSTEM}\n\n${prompt}`,
        stream: false,
        options: maxTokens ? { num_predict: maxTokens } : undefined
      })
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
  answerQuestion(question: string, ctx: AIContext, history: ChatHistory[] = []) {
    const prior = history
      .slice(-12)
      .map((m) => `${m.role === "assistant" ? "Tutor" : "Student"}: ${m.text.slice(0, 800)}`)
      .join("\n");
    const context = prior
      ? `Previous conversation (same topic, in order):\n${prior}\n\nResolve follow-ups ("these formulas", "that symbol", "another example", "harder", "continue") DIRECTLY from it using the same notation. Ask for clarification only if genuinely ambiguous. Now answer: ${question}`
      : `Answer exactly: ${question}`;
    return this.generate(`${context}. Then add one line connecting it to subtopic ${ctx.subtopicId}${ctx.formulaId ? `, formula ${ctx.formulaId}` : ""}.`);
  }
  refresher(concept: string, ctx: AIContext) {
    return this.generate(`Give a 2-line refresher on ${concept} needed for subtopic ${ctx.subtopicId}, then say "back to the question".`);
  }
  async makeTitle(texts: string[]): Promise<string> {
    const raw = await this.generate(
      `Give this study conversation a short title (max 6 words, no quotes, no punctuation at the end), based on these opening messages:\n${texts.slice(0, 4).join("\n")}`
    );
    const clean = raw.replace(/^["'“”]+|["'“”.:;!?]+$/g, "").trim().slice(0, 80);
    if (!clean) throw new Error("empty title");
    return clean;
  }
  async draftTopic(request: string): Promise<TopicDraft> {
    const raw = await this.generate(
      `A student asks: "Teach me ${request}". Reply with ONLY JSON (no prose): {"subject": "...", "topic": "...", "scope": [{"title": "...", "kind": "note|formula|example|practice"}], "subtopics": [{"name": "...", "concept": "one sentence"}]}. Keep 3-6 scope items and 1-4 subtopics. Subtopic names must be short (1-4 words), plain words, no quotes or punctuation — they become lesson links.`,
      // Reasoning models spend most of the budget thinking: measured
      // ~800 reasoning tokens for a short draft, so 800 total starves the
      // answer (empty content, finish_reason=length). Budget generously.
      1500
    );
    return parseDraft(raw);
  }
  // Builds the teachable core of one subtopic: 2-3 formulas and 4-5 practice
  // questions with single-number answers. Strict JSON so it persists directly.
  async draftLesson(subtopic: string, concept: string, topic: string): Promise<LessonDraft> {
    const raw = await this.generate(
      `Write lesson content for the subtopic "${subtopic}" (topic: ${topic}). Concept: ${concept}. ` +
        `Reply with ONLY JSON (no prose): {"formulas": [{"latex": "...", "symbols": [{"name": "...", "meaning": "...", "unit": "..."}], "when_to_use": "..."}], ` +
        `"practice": [{"difficulty": 1|2|3, "prompt": "...", "answer": "..."}]}. ` +
        `Rules: 2-3 formulas with real LaTeX (no $ delimiters); 2-4 symbols each with SI units; ` +
        `4-5 practice questions, each solvable to ONE number with a unit (answer like "5 m/s", "21.7 m/s", "9.8 m/s²" — never a sentence); ` +
        `prompts give concrete numbers; difficulty 1 = plug-in, 2 = rearrange or two steps, 3 = combine ideas; ` +
        `every answer must be numerically correct — double-check each calculation.`,
      // Full lessons measured ~900 reasoning + ~1800 answer tokens: 800
      // total used to return empty content. See draftTopic note.
      3500
    );
    return parseLesson(raw);
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

  protected async generate(prompt: string, maxTokens = 800): Promise<string> {
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
        max_tokens: maxTokens
      })
    });
    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Groq empty response");
    return text;
  }
}

// Models often emit LaTeX backslashes raw ("\lambda" instead of
// "\\lambda"), which is invalid JSON. Repair lone backslashes before
// parsing; valid escapes are left untouched.
function extractJSON(raw: string): any {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Response not JSON");
  const repaired = raw.slice(start, end + 1).replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  return JSON.parse(repaired);
}

function parseDraft(raw: string): TopicDraft {
  const d = extractJSON(raw) as TopicDraft;
  if (!d.topic || !d.subject || !Array.isArray(d.subtopics) || d.subtopics.length === 0) {
    throw new Error("Draft incomplete");
  }
  // Lesson links break on quotes/punctuation: keep short plain names only.
  d.subtopics = d.subtopics
    .filter((s) => s && typeof s.name === "string" && typeof s.concept === "string")
    .map((s) => ({ name: s.name.replace(/["'“”‘’.,;:!?()]/g, "").trim().slice(0, 60), concept: s.concept.trim().slice(0, 1000) }))
    .filter((s) => s.name.length >= 2 && s.concept.length >= 10);
  if (d.subtopics.length === 0) throw new Error("Draft incomplete");
  d.topic = d.topic.trim().slice(0, 120);
  d.subject = d.subject.trim().slice(0, 120);
  return d;
}

function parseLesson(raw: string): LessonDraft {
  let d: LessonDraft;
  try {
    d = extractJSON(raw) as LessonDraft;
  } catch {
    throw new Error("Lesson not JSON");
  }
  if (!Array.isArray(d.formulas) || d.formulas.length === 0) throw new Error("Lesson has no formulas");
  if (!Array.isArray(d.practice) || d.practice.length === 0) throw new Error("Lesson has no practice");
  const formulas = d.formulas
    .filter((f) => f && typeof f.latex === "string" && f.latex.trim() && Array.isArray(f.symbols) && f.symbols.length > 0)
    .slice(0, 3)
    .map((f) => ({
      latex: f.latex.trim().replace(/^\$+|\$+$/g, "").slice(0, 500),
      symbols: f.symbols
        .filter((s) => s && s.name && s.meaning)
        .slice(0, 6)
        .map((s) => ({ name: String(s.name).slice(0, 40), meaning: String(s.meaning).slice(0, 200), unit: String(s.unit ?? "").slice(0, 40) })),
      when_to_use: String(f.when_to_use ?? "").slice(0, 500)
    }));
  const practice = d.practice
    .filter((q) => q && typeof q.prompt === "string" && q.prompt.trim() && typeof q.answer === "string" && /-?\d+(?:\.\d+)?/.test(q.answer))
    .slice(0, 5)
    .map((q) => ({
      difficulty: [1, 2, 3].includes(q.difficulty) ? q.difficulty : 1,
      prompt: q.prompt.trim().slice(0, 500),
      answer: q.answer.trim().slice(0, 60)
    }));
  if (formulas.length === 0 || practice.length === 0) throw new Error("Lesson content unusable");
  return { formulas, practice };
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
