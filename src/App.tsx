import { useEffect, useRef, useState } from "react";
import SymbolBoard from "./components/SymbolBoard";
import MomentBar, { MAX_SYMBOLS, MIN_SYMBOLS } from "./components/MomentBar";
import CaregiverPanel from "./components/CaregiverPanel";
import ShareCard from "./components/ShareCard";
import StoryView, { type StoryStatus } from "./components/StoryView";
import { generateStory, type ReadingLevel, type StoryResponse } from "./lib/generateStory";
import { useSwitchScanning } from "./lib/useSwitchScanning";
import { SYMBOLS_BY_ID } from "../api/src/shared/symbols";

type Theme = "default" | "high-contrast";

export default function App() {
  const [theme, setTheme] = useState<Theme>("default");
  const [fontScale, setFontScale] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("standard");
  const [storyStatus, setStoryStatus] = useState<StoryStatus>("idle");
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);
  const storyRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [scanning, setScanning] = useState(false);
  const [scanSpeed, setScanSpeed] = useState(1200);
  const [shareOpen, setShareOpen] = useState(false);
  const [caregiverOpen, setCaregiverOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // While a dialog is open, the page behind it is inert (no focus,
  // no clicks, skipped by switch scanning).
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (shareOpen || caregiverOpen) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [shareOpen, caregiverOpen]);

  useSwitchScanning(scanning, scanSpeed);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "high-contrast") root.setAttribute("data-theme", "high-contrast");
    else root.removeAttribute("data-theme");
    if (reducedMotion) root.setAttribute("data-reduced-motion", "true");
    else root.removeAttribute("data-reduced-motion");
    root.style.setProperty("--font-scale", String(fontScale));
  }, [theme, fontScale, reducedMotion]);

  function toggleSymbol(id: string) {
    const label = SYMBOLS_BY_ID[id].label;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
      setAnnouncement(`Removed ${label}.`);
    } else if (selectedIds.length >= MAX_SYMBOLS) {
      setAnnouncement(`Your moment is full. Remove a symbol before adding ${label}.`);
    } else {
      setSelectedIds([...selectedIds, id]);
      setAnnouncement(`Added ${label}.`);
    }
  }

  function removeSymbol(id: string) {
    setSelectedIds(selectedIds.filter((s) => s !== id));
    setAnnouncement(`Removed ${SYMBOLS_BY_ID[id].label}.`);
  }

  function moveSymbol(index: number, direction: -1 | 1) {
    const next = [...selectedIds];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setSelectedIds(next);
    setAnnouncement(
      `${SYMBOLS_BY_ID[next[target]].label} moved to position ${target + 1} of ${next.length}.`,
    );
  }

  function clearSymbols() {
    setSelectedIds([]);
    setAnnouncement("Cleared your moment.");
  }

  useEffect(() => {
    if (storyStatus === "loading") storyRef.current?.focus();
  }, [storyStatus]);

  async function tellMyDay() {
    setStoryStatus("loading");
    setStoryError(null);
    try {
      const result = await generateStory(selectedIds, readingLevel);
      setStory(result);
      setStoryStatus("ready");
    } catch (err) {
      setStoryError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStoryStatus("error");
    }
  }

  const canTell = selectedIds.length >= MIN_SYMBOLS && storyStatus !== "loading";

  return (
    <>
      <div ref={contentRef} className="min-h-full flex flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b border-border bg-surface px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold">Tell My Day</h1>
        <div
          className="flex flex-wrap items-center gap-3"
          role="group"
          aria-label="Display and access settings"
          data-scan-group="settings"
          data-scan-exempt
        >
          <label className="text-base">
            <span className="sr-only">Text size</span>
            <select
              aria-label="Text size"
              className="min-h-tap min-w-tap border-2 border-border rounded-lg px-3 py-2 bg-surface text-fg"
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
            >
              <option value={0.9}>Small</option>
              <option value={1}>Medium</option>
              <option value={1.25}>Large</option>
              <option value={1.5}>Extra large</option>
            </select>
          </label>
          <button
            type="button"
            aria-pressed={theme === "high-contrast"}
            onClick={() => setTheme(theme === "high-contrast" ? "default" : "high-contrast")}
            className="min-h-tap min-w-tap border-2 border-border rounded-lg px-4 py-2 bg-surface font-semibold"
          >
            High contrast
          </button>
          <button
            type="button"
            aria-pressed={reducedMotion}
            onClick={() => setReducedMotion(!reducedMotion)}
            className="min-h-tap min-w-tap border-2 border-border rounded-lg px-4 py-2 bg-surface font-semibold"
          >
            Reduce motion
          </button>
          <button
            type="button"
            aria-pressed={scanning}
            onClick={() => {
              setScanning(!scanning);
              setAnnouncement(
                scanning
                  ? "Switch scanning off."
                  : "Switch scanning on. Press Space or tap the screen to select.",
              );
            }}
            className={`min-h-tap min-w-tap border-2 rounded-lg px-4 py-2 font-semibold ${
              scanning ? "bg-accent text-accent-fg border-accent" : "bg-surface border-border"
            }`}
          >
            Switch scanning
          </button>
          <label className="flex items-center gap-2 text-base font-semibold">
            <span className="sr-only">Scan speed</span>
            <select
              aria-label="Scan speed"
              className="min-h-tap border-2 border-border rounded-lg px-3 py-2 bg-surface text-fg font-normal"
              value={scanSpeed}
              onChange={(e) => setScanSpeed(Number(e.target.value))}
            >
              <option value={800}>Fast scan</option>
              <option value={1200}>Medium scan</option>
              <option value={2000}>Slow scan</option>
            </select>
          </label>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
        <MomentBar
          selectedIds={selectedIds}
          onRemove={removeSymbol}
          onMove={moveSymbol}
          onClear={clearSymbols}
        />

        <div className="flex flex-wrap items-center gap-4 mb-6" data-scan-group="actions">
          <button
            type="button"
            onClick={tellMyDay}
            disabled={!canTell}
            aria-describedby="tell-hint"
            className="min-h-tap px-8 py-3 rounded-xl bg-accent text-accent-fg text-xl font-bold border-2 border-accent disabled:opacity-50"
          >
            {storyStatus === "loading" ? "Writing…" : "Tell my day"}
          </button>
          <label className="flex items-center gap-2 text-base font-semibold">
            Reading level
            <select
              className="min-h-tap border-2 border-border rounded-lg px-3 py-2 bg-surface text-fg font-normal"
              value={readingLevel}
              onChange={(e) => setReadingLevel(e.target.value as ReadingLevel)}
            >
              <option value="standard">Standard</option>
              <option value="easy">Easy</option>
            </select>
          </label>
          {selectedIds.length < MIN_SYMBOLS && (
            <p id="tell-hint" className="text-base text-muted">
              Pick at least {MIN_SYMBOLS} symbols first.
            </p>
          )}
        </div>

        <StoryView
          ref={storyRef}
          status={storyStatus}
          error={storyError}
          story={story}
          onShare={() => setShareOpen(true)}
        />

        <SymbolBoard selectedIds={selectedIds} onToggle={toggleSymbol} />
      </main>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <footer className="border-t border-border bg-surface px-6 py-3 text-sm text-muted flex flex-wrap items-center justify-between gap-3">
        <p>
          Built by a direct support professional. All profile content is synthetic and fictional.
        </p>
        {/* Deliberately outside every scan group and exempt from the switch,
            so the primary user can't open it by accident while scanning. */}
        <button
          type="button"
          data-scan-exempt
          onClick={() => setCaregiverOpen(true)}
          className="min-h-tap px-4 py-2 rounded-lg border-2 border-border bg-surface font-semibold text-fg text-base"
        >
          Caregiver settings
        </button>
      </footer>
      </div>

      {shareOpen && story && <ShareCard story={story} onClose={() => setShareOpen(false)} />}
      {caregiverOpen && <CaregiverPanel onClose={() => setCaregiverOpen(false)} />}
    </>
  );
}
