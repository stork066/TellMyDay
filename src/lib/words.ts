// Word segmentation for the read-along highlight. The Web Speech `boundary`
// event reports a charIndex into the spoken string; these helpers map that
// index back to the word being spoken.

export type WordSpan = {
  text: string;
  start: number;
  end: number;
  isWord: boolean;
};

export function segmentWords(text: string): WordSpan[] {
  const spans: WordSpan[] = [];
  const re = /\S+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      spans.push({ text: text.slice(last, m.index), start: last, end: m.index, isWord: false });
    }
    spans.push({ text: m[0], start: m.index, end: m.index + m[0].length, isWord: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    spans.push({ text: text.slice(last), start: last, end: text.length, isWord: false });
  }
  return spans;
}

// The boundary charIndex usually lands on the first character of the word.
// Active word = the last word starting at or before charIndex.
export function activeWordStart(spans: readonly WordSpan[], charIndex: number | null): number | null {
  if (charIndex === null) return null;
  let active: number | null = null;
  for (const span of spans) {
    if (!span.isWord) continue;
    if (span.start > charIndex) break;
    active = span.start;
  }
  return active;
}
