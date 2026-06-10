import { describe, expect, it } from "vitest";
import { activeWordStart, segmentWords } from "../src/lib/words";

describe("segmentWords", () => {
  it("splits words and whitespace with exact offsets", () => {
    const spans = segmentWords("I swam today.");
    expect(spans).toEqual([
      { text: "I", start: 0, end: 1, isWord: true },
      { text: " ", start: 1, end: 2, isWord: false },
      { text: "swam", start: 2, end: 6, isWord: true },
      { text: " ", start: 6, end: 7, isWord: false },
      { text: "today.", start: 7, end: 13, isWord: true },
    ]);
  });

  it("round-trips the original text", () => {
    const text = "  My dog Biscuit \n walked  with me. ";
    expect(segmentWords(text).map((s) => s.text).join("")).toBe(text);
  });

  it("handles empty strings", () => {
    expect(segmentWords("")).toEqual([]);
  });
});

describe("activeWordStart", () => {
  const spans = segmentWords("I swam today.");

  it("returns the word starting at charIndex", () => {
    expect(activeWordStart(spans, 2)).toBe(2);
    expect(activeWordStart(spans, 7)).toBe(7);
  });

  it("returns the previous word when charIndex falls mid-word or on whitespace", () => {
    expect(activeWordStart(spans, 4)).toBe(2);
    expect(activeWordStart(spans, 6)).toBe(2);
  });

  it("returns null when idle", () => {
    expect(activeWordStart(spans, null)).toBeNull();
  });
});
