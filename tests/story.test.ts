import { describe, expect, it } from "vitest";
import {
  HttpError,
  parseModelOutput,
  parseRetrievePayload,
  validateInput,
  verifyQuote,
  type Fact,
} from "../api/src/shared/story.js";

describe("validateInput", () => {
  it("rejects non-object bodies", () => {
    expect(() => validateInput(null)).toThrow(HttpError);
    expect(() => validateInput("hi")).toThrow(HttpError);
  });

  it("rejects missing or too-few symbols with a friendly message", () => {
    expect(() => validateInput({})).toThrow(/pick some symbols/i);
    expect(() => validateInput({ symbolIds: ["swim"] })).toThrow(/at least 3/i);
  });

  it("filters unknown ids and non-strings before counting", () => {
    expect(() =>
      validateInput({ symbolIds: ["swim", "not-a-symbol", 42, "swim"] }),
    ).toThrow(/at least 3/i);
  });

  it("dedupes, clamps to 8, and keeps order", () => {
    const ids = [
      "swim", "swim", "mom", "dog", "happy", "pizza", "walk", "read", "music", "home", "cafe",
    ];
    const { symbols } = validateInput({ symbolIds: ids });
    expect(symbols.map((s) => s.id)).toEqual([
      "swim", "mom", "dog", "happy", "pizza", "walk", "read", "music",
    ]);
  });

  it("defaults readingLevel to standard and accepts easy", () => {
    const base = { symbolIds: ["swim", "mom", "dog"] };
    expect(validateInput(base).readingLevel).toBe("standard");
    expect(validateInput({ ...base, readingLevel: "easy" }).readingLevel).toBe("easy");
    expect(validateInput({ ...base, readingLevel: "bogus" }).readingLevel).toBe("standard");
  });
});

describe("parseRetrievePayload", () => {
  const payload = {
    response: [
      {
        content: [
          {
            type: "text",
            text: JSON.stringify([
              { ref_id: 1, content: "Places Sam goes." },
              { ref_id: 0, content: "Marcus is Sam's best friend." },
            ]),
          },
        ],
      },
    ],
    references: [
      { type: "file", id: "0", docName: "people.md" },
      { type: "file", id: "1", docName: "places.md" },
    ],
  };

  it("maps chunks to facts with docNames, sorted by ref_id", () => {
    const facts = parseRetrievePayload(payload);
    expect(facts).toEqual([
      { factId: 0, docName: "people.md", content: "Marcus is Sam's best friend." },
      { factId: 1, docName: "places.md", content: "Places Sam goes." },
    ]);
  });

  it("returns [] for malformed payloads instead of throwing", () => {
    expect(parseRetrievePayload({})).toEqual([]);
    expect(parseRetrievePayload({ response: [{ content: [{ text: "not json" }] }] })).toEqual([]);
    expect(parseRetrievePayload(null)).toEqual([]);
  });
});

describe("verifyQuote", () => {
  it("matches case- and whitespace-insensitively", () => {
    expect(verifyQuote("every  THURSDAY at the pool", "They see each other every Thursday\nat the pool.")).toBe(true);
  });

  it("rejects quotes not present in the fact", () => {
    expect(verifyQuote("at the beach", "They see each other at the pool.")).toBe(false);
    expect(verifyQuote("", "anything")).toBe(false);
  });
});

describe("parseModelOutput", () => {
  const facts: Fact[] = [
    { factId: 0, docName: "people.md", content: "Marcus is Sam's best friend." },
  ];

  it("keeps verified citations and flags paraphrased ones", () => {
    const content = JSON.stringify({
      sentences: [
        {
          text: "I swam with my best friend Marcus.",
          citations: [{ factId: 0, quote: "Marcus is Sam's best friend." }],
        },
        {
          text: "We laughed a lot.",
          citations: [{ factId: 0, quote: "Marcus laughs a lot." }],
        },
      ],
    });
    const sentences = parseModelOutput(content, facts);
    expect(sentences).toHaveLength(2);
    expect(sentences[0].citations[0].verified).toBe(true);
    expect(sentences[1].citations[0].verified).toBe(false);
  });

  it("drops citations pointing at unknown facts (no invented sources)", () => {
    const content = JSON.stringify({
      sentences: [{ text: "Hello.", citations: [{ factId: 99, quote: "made up" }] }],
    });
    expect(parseModelOutput(content, facts)[0].citations).toEqual([]);
  });

  it("clamps to 4 sentences and skips empty ones", () => {
    const content = JSON.stringify({
      sentences: [
        { text: "One.", citations: [] },
        { text: "  ", citations: [] },
        { text: "Two.", citations: [] },
        { text: "Three.", citations: [] },
        { text: "Four.", citations: [] },
        { text: "Five.", citations: [] },
      ],
    });
    expect(parseModelOutput(content, facts).map((s) => s.text)).toEqual([
      "One.", "Two.", "Three.", "Four.",
    ]);
  });

  it("returns [] on non-JSON model output", () => {
    expect(parseModelOutput("I am not JSON", facts)).toEqual([]);
  });
});
