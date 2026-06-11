// Core generation pipeline, shared by the Azure Function (../functions/) and
// the Vite dev middleware. Framework-agnostic: takes a parsed request body,
// returns a StoryResponse, throws HttpError with a user-friendly message on
// failure.
//
// Grounding contract (the core safety property of the app):
// the model may use ONLY the selected symbols and the numbered profile facts
// retrieved from the Foundry IQ knowledge base. Every fact it uses must come
// back as a citation with a verbatim quote, which we verify server-side
// against the retrieved text.

import { SYMBOLS_BY_ID, type SymbolEntry } from "./symbols.js";

export type ReadingLevel = "easy" | "standard";

export type Fact = { factId: number; docName: string; content: string };

export type Citation = {
  factId: number;
  docName: string;
  quote: string;
  verified: boolean;
};

export type StorySentence = { text: string; citations: Citation[] };

export type StoryResponse = {
  story: string;
  sentences: StorySentence[];
  symbolIds: string[];
  readingLevel: ReadingLevel;
  retrievedDocs: string[];
};

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const MIN_SYMBOLS = 3;
const MAX_SYMBOLS = 8;

function requiredEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new HttpError(500, "The server is missing configuration. Please try again later.");
  return v;
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

// ---------- input validation ----------

export function validateInput(body: unknown): {
  symbols: SymbolEntry[];
  readingLevel: ReadingLevel;
} {
  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "Pick some symbols first, then try again.");
  }
  const { symbolIds, readingLevel } = body as { symbolIds?: unknown; readingLevel?: unknown };
  if (!Array.isArray(symbolIds)) {
    throw new HttpError(400, "Pick some symbols first, then try again.");
  }

  const seen = new Set<string>();
  const symbols: SymbolEntry[] = [];
  for (const id of symbolIds) {
    if (typeof id !== "string" || seen.has(id)) continue;
    const entry = SYMBOLS_BY_ID[id];
    if (!entry) continue;
    seen.add(id);
    symbols.push(entry);
    if (symbols.length === MAX_SYMBOLS) break;
  }

  if (symbols.length < MIN_SYMBOLS) {
    throw new HttpError(400, `Pick at least ${MIN_SYMBOLS} symbols to tell your day.`);
  }

  const level: ReadingLevel = readingLevel === "easy" ? "easy" : "standard";
  return { symbols, readingLevel: level };
}

// ---------- Foundry IQ retrieve ----------

// The retrieve response wraps the grounded chunks as a JSON string inside
// response[0].content[0].text; references[] maps each ref_id to its docName.
export function parseRetrievePayload(payload: unknown): Fact[] {
  const obj = payload as {
    response?: { content?: { text?: string }[] }[];
    references?: { id?: string; docName?: string }[];
  };
  const text = obj?.response?.[0]?.content?.[0]?.text;
  if (typeof text !== "string") return [];

  let chunks: unknown;
  try {
    chunks = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(chunks)) return [];

  const docNames = new Map<string, string>();
  for (const ref of obj.references ?? []) {
    if (ref?.id !== undefined && typeof ref.docName === "string") {
      docNames.set(String(ref.id), ref.docName);
    }
  }

  const facts: Fact[] = [];
  for (const chunk of chunks) {
    const c = chunk as { ref_id?: number; content?: string };
    if (typeof c?.ref_id !== "number" || typeof c?.content !== "string") continue;
    facts.push({
      factId: c.ref_id,
      docName: docNames.get(String(c.ref_id)) ?? "profile",
      content: c.content,
    });
  }
  return facts.sort((a, b) => a.factId - b.factId);
}

export function searchEnv() {
  return {
    endpoint: trimSlash(requiredEnv("AZURE_SEARCH_ENDPOINT")),
    key: requiredEnv("AZURE_SEARCH_KEY"),
    kbName: requiredEnv("AZURE_SEARCH_KB_NAME"),
    apiVersion: process.env.FOUNDRY_IQ_API_VERSION?.trim() || "2026-05-01-preview",
  };
}

// A hung upstream call would otherwise stall until the Static Web Apps
// gateway kills the function at 45s; time out early and retry once so the
// user gets a friendly error (or a recovery) well within that budget.
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  friendlyMessage: string,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
    } catch (err) {
      console.error(`Upstream call attempt ${attempt + 1} failed: ${String(err)}`);
    }
  }
  throw new HttpError(504, friendlyMessage);
}

export async function retrieveByIntents(searches: string[]): Promise<Fact[]> {
  const { endpoint, key, kbName, apiVersion } = searchEnv();
  const url = `${endpoint}/knowledgebases/${encodeURIComponent(kbName)}/retrieve?api-version=${apiVersion}`;
  const body = {
    intents: searches.map((search) => ({ type: "semantic", search })),
  };

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": key },
      body: JSON.stringify(body),
    },
    "We couldn't read the profile right now. Please try again.",
  );
  if (!res.ok && res.status !== 206) {
    console.error(`IQ retrieve failed: HTTP ${res.status} ${await res.text()}`);
    throw new HttpError(502, "We couldn't read the profile right now. Please try again.");
  }
  return parseRetrievePayload(await res.json());
}

function retrieveFacts(symbols: SymbolEntry[]): Promise<Fact[]> {
  return retrieveByIntents(symbols.map((s) => s.label));
}

// ---------- story generation ----------

const READING_LEVEL_INSTRUCTIONS: Record<ReadingLevel, string> = {
  easy: "very simple: short, common words and short sentences, like an early reader book.",
  standard: "clear, everyday language an adult would use.",
};

function buildSystemPrompt(readingLevel: ReadingLevel): string {
  return [
    "You help a non-speaking adult narrate a moment from their day.",
    "You receive an ordered list of picture symbols they selected, plus numbered profile facts retrieved from their knowledge base.",
    "",
    "Rules you must never break:",
    "- Write 2 to 4 short, warm, first-person sentences.",
    "- Include the idea of EVERY selected symbol at least once, following their order where it reads naturally. Do not skip any symbol.",
    "- Use ONLY (a) the ideas in the selected symbols and (b) the numbered profile facts. Never invent people, places, events, or details that are not in the symbols or the facts.",
    '- If a symbol has no matching fact, keep that part general ("my friend", "the park") — never make up a name or specifics.',
    "- Tone: positive, dignified, age-appropriate for an adult. Never childish, never clinical.",
    `- Reading level: ${READING_LEVEL_INSTRUCTIONS[readingLevel]}`,
    "",
    "Return strict JSON only, in this exact shape:",
    '{"sentences":[{"text":"<one sentence>","citations":[{"factId":<number>,"quote":"<short phrase copied verbatim from that fact that supports the sentence>"}]}]}',
    'A sentence that uses no profile fact has "citations": [].',
  ].join("\n");
}

function buildUserPrompt(symbols: SymbolEntry[], facts: Fact[]): string {
  const symbolList = symbols
    .map((s, i) => `${i + 1}. ${s.label} (${s.category})`)
    .join("\n");
  const factList =
    facts.length === 0
      ? "No profile facts were retrieved. Keep everything general."
      : facts.map((f) => `[${f.factId}] from ${f.docName}:\n${f.content}`).join("\n\n");
  return `Selected symbols, in order:\n${symbolList}\n\nProfile facts (synthetic):\n${factList}`;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function verifyQuote(quote: string, factContent: string): boolean {
  const q = normalize(quote);
  return q.length > 0 && normalize(factContent).includes(q);
}

type ModelSentence = {
  text?: unknown;
  citations?: { factId?: unknown; quote?: unknown }[];
};

export function parseModelOutput(content: string, facts: Fact[]): StorySentence[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  const raw = (parsed as { sentences?: unknown })?.sentences;
  if (!Array.isArray(raw)) return [];

  const factsById = new Map(facts.map((f) => [f.factId, f]));
  const sentences: StorySentence[] = [];
  for (const item of raw as ModelSentence[]) {
    if (typeof item?.text !== "string" || item.text.trim() === "") continue;
    const citations: Citation[] = [];
    for (const c of Array.isArray(item.citations) ? item.citations : []) {
      if (typeof c?.factId !== "number" || typeof c?.quote !== "string") continue;
      const fact = factsById.get(c.factId);
      if (!fact) continue;
      const quote = c.quote.trim().slice(0, 240);
      citations.push({
        factId: fact.factId,
        docName: fact.docName,
        quote,
        verified: verifyQuote(quote, fact.content),
      });
    }
    sentences.push({ text: item.text.trim(), citations });
    if (sentences.length === 4) break;
  }
  return sentences;
}

async function generateSentences(
  symbols: SymbolEntry[],
  facts: Fact[],
  readingLevel: ReadingLevel,
): Promise<StorySentence[]> {
  const endpoint = trimSlash(requiredEnv("FOUNDRY_OPENAI_ENDPOINT"));
  const apiKey = requiredEnv("FOUNDRY_API_KEY");
  const deployment = requiredEnv("FOUNDRY_MODEL_DEPLOYMENT");

  const res = await fetchWithTimeout(
    `${endpoint}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        model: deployment,
        messages: [
          { role: "system", content: buildSystemPrompt(readingLevel) },
          { role: "user", content: buildUserPrompt(symbols, facts) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 600,
      }),
    },
    "The story writer didn't answer. Please try again in a moment.",
  );
  if (!res.ok) {
    console.error(`Chat completion failed: HTTP ${res.status} ${await res.text()}`);
    throw new HttpError(502, "The story writer is busy right now. Please try again.");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new HttpError(502, "The story writer returned nothing. Please try again.");
  }

  const sentences = parseModelOutput(content, facts);
  if (sentences.length === 0) {
    console.error(`Unusable model output: ${content}`);
    throw new HttpError(502, "We couldn't put the story together. Please try again.");
  }
  return sentences;
}

// ---------- entry point ----------

export async function generateStory(body: unknown): Promise<StoryResponse> {
  const { symbols, readingLevel } = validateInput(body);
  const facts = await retrieveFacts(symbols);
  const sentences = await generateSentences(symbols, facts, readingLevel);

  return {
    story: sentences.map((s) => s.text).join(" "),
    sentences,
    symbolIds: symbols.map((s) => s.id),
    readingLevel,
    retrievedDocs: [...new Set(facts.map((f) => f.docName))],
  };
}
