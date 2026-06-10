import { useEffect, useRef, useState } from "react";
import { SYMBOLS_BY_ID } from "../../api/src/shared/symbols";
import type { StoryResponse } from "../lib/generateStory";

type Props = {
  story: StoryResponse;
  onClose: () => void;
};

export default function ShareCard({ story, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function copyText() {
    try {
      await navigator.clipboard.writeText(`${date} — ${story.story}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.6)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Family share card"
        data-scan-group="share"
        className="bg-surface text-fg border-4 border-accent rounded-2xl p-6 max-w-xl w-full max-h-full overflow-auto"
      >
        <h2 className="text-2xl font-bold mb-1">My day</h2>
        <p className="text-base text-muted mb-4">{date}</p>

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

        <p className="text-2xl leading-relaxed mb-6">{story.story}</p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyText}
            className="min-h-tap px-6 py-2 rounded-xl bg-accent text-accent-fg text-lg font-bold border-2 border-accent"
          >
            {copied ? "Copied ✓" : "Copy text"}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-tap px-6 py-2 rounded-xl border-2 border-border bg-surface text-lg font-semibold"
          >
            Close
          </button>
        </div>

        <p className="text-sm text-muted mt-4">
          Told with Tell My Day. Symbols: Mulberry Symbol Set (CC BY-SA 4.0). All profile content
          is synthetic and fictional.
        </p>
      </div>
    </div>
  );
}
