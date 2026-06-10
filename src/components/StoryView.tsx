import { forwardRef } from "react";
import { SYMBOLS_BY_ID } from "../../api/src/shared/symbols";
import type { StoryResponse } from "../lib/generateStory";
import { useSpeech } from "../lib/useSpeech";
import { activeWordStart, segmentWords, type WordSpan } from "../lib/words";

export type StoryStatus = "idle" | "loading" | "error" | "ready";

type Props = {
  status: StoryStatus;
  error: string | null;
  story: StoryResponse | null;
  onShare: () => void;
};

type NumberedCitation = {
  number: number;
  docName: string;
  quote: string;
  verified: boolean;
};

// Assign each distinct (factId, quote) one number across the whole story so
// sentence markers and the grounding list line up.
function numberCitations(story: StoryResponse): {
  list: NumberedCitation[];
  bySentence: number[][];
} {
  const list: NumberedCitation[] = [];
  const index = new Map<string, number>();
  const bySentence = story.sentences.map((sentence) =>
    sentence.citations.map((c) => {
      const key = `${c.factId}|${c.quote}`;
      let num = index.get(key);
      if (num === undefined) {
        num = list.length + 1;
        index.set(key, num);
        list.push({ number: num, docName: c.docName, quote: c.quote, verified: c.verified });
      }
      return num;
    }),
  );
  return { list, bySentence };
}

// Word spans per sentence, with offsets into the full spoken string
// (sentences joined by a single space) so the boundary highlight lines up.
function sentenceWordSpans(story: StoryResponse): WordSpan[][] {
  let offset = 0;
  return story.sentences.map((sentence) => {
    const spans = segmentWords(sentence.text).map((s) => ({
      ...s,
      start: s.start + offset,
      end: s.end + offset,
    }));
    offset += sentence.text.length + 1;
    return spans;
  });
}

const StoryView = forwardRef<HTMLElement, Props>(function StoryView(
  { status, error, story, onShare },
  ref,
) {
  if (status === "idle") return null;

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label="Your story"
      data-scan-group="story"
      className="bg-surface border-2 border-border rounded-xl p-5 mb-6"
    >
      <div aria-live="polite">
        {status === "loading" && <p className="text-lg">Writing your story…</p>}

        {status === "error" && (
          <p className="text-lg" role="alert">
            {error}
          </p>
        )}

        {status === "ready" && story && <StoryBody story={story} onShare={onShare} />}
      </div>
    </section>
  );
});

function ShareButton({ onShare }: { onShare: () => void }) {
  return (
    <button
      type="button"
      onClick={onShare}
      className="min-h-tap min-w-tap px-4 py-2 rounded-xl border-2 border-border bg-surface text-lg font-semibold"
    >
      Share with family
    </button>
  );
}

function StoryBody({ story, onShare }: { story: StoryResponse; onShare: () => void }) {
  const { list, bySentence } = numberCitations(story);
  const wordsBySentence = sentenceWordSpans(story);
  const speech = useSpeech(story.story);
  const highlightStart = activeWordStart(wordsBySentence.flat(), speech.charIndex);

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">My story</h2>

      <ul className="flex flex-wrap gap-2 mb-4 list-none" aria-label="Symbols in this story">
        {story.symbolIds.map((id) => {
          const s = SYMBOLS_BY_ID[id];
          return (
            <li
              key={id}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-border"
            >
              <img src={s.file} alt="" className="w-10 h-10" />
              <span className="text-base">{s.label}</span>
            </li>
          );
        })}
      </ul>

      <p className="text-2xl leading-relaxed mb-4">
        {story.sentences.map((_, i) => (
          <span key={i}>
            {wordsBySentence[i].map((w) =>
              w.isWord && w.start === highlightStart ? (
                <mark key={w.start} className="bg-accent text-accent-fg rounded px-0.5">
                  {w.text}
                </mark>
              ) : (
                <span key={w.start}>{w.text}</span>
              ),
            )}
            {bySentence[i].map((num) => (
              <sup key={num} className="ml-1 font-semibold text-accent">
                <span className="sr-only">, grounded fact </span>[{num}]
              </sup>
            ))}{" "}
          </span>
        ))}
      </p>

      {speech.supported ? (
        <div
          className="flex flex-wrap items-center gap-3 mb-4"
          role="group"
          aria-label="Read aloud controls"
        >
          <button
            type="button"
            onClick={() => (speech.state === "idle" ? speech.play() : speech.pauseOrResume())}
            className="min-h-tap min-w-tap px-6 py-2 rounded-xl bg-accent text-accent-fg text-lg font-bold border-2 border-accent"
          >
            {speech.state === "speaking" ? "⏸ Pause" : speech.state === "paused" ? "▶ Resume" : "🔊 Read aloud"}
          </button>
          <button
            type="button"
            onClick={speech.stop}
            disabled={speech.state === "idle"}
            className="min-h-tap min-w-tap px-4 py-2 rounded-xl border-2 border-border bg-surface text-lg font-semibold disabled:opacity-50"
          >
            ⏹ Stop
          </button>
          <ShareButton onShare={onShare} />
          <label className="flex items-center gap-2 text-base font-semibold min-h-tap">
            Speed
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.1}
              value={speech.rate}
              onChange={(e) => speech.setRate(Number(e.target.value))}
              aria-valuetext={`${speech.rate.toFixed(1)} times normal speed`}
            />
            <span aria-hidden="true" className="font-normal text-muted">
              {speech.rate.toFixed(1)}×
            </span>
          </label>
          <label className="flex items-center gap-2 text-base font-semibold min-h-tap">
            Pitch
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.1}
              value={speech.pitch}
              onChange={(e) => speech.setPitch(Number(e.target.value))}
              aria-valuetext={`pitch ${speech.pitch.toFixed(1)}`}
            />
            <span aria-hidden="true" className="font-normal text-muted">
              {speech.pitch.toFixed(1)}
            </span>
          </label>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="text-base text-muted">Read-aloud isn't supported in this browser.</p>
          <ShareButton onShare={onShare} />
        </div>
      )}

      {list.length > 0 ? (
        <div className="border-t-2 border-border pt-3">
          <h3 className="text-lg font-bold mb-2">From the profile (synthetic)</h3>
          <ol className="list-none flex flex-col gap-2">
            {list.map((c) => (
              <li key={c.number} className="text-base">
                <span className="font-semibold text-accent">[{c.number}]</span> “{c.quote}”{" "}
                <span className="text-muted">
                  — {c.docName}
                  {c.verified ? ", found in profile ✓" : ", paraphrased"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-base text-muted border-t-2 border-border pt-3">
          No matching profile facts for these symbols, so the story stays general on purpose —
          nothing is ever made up.
        </p>
      )}
    </div>
  );
}

export default StoryView;
