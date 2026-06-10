import { useEffect, useState } from "react";
import SymbolBoard from "./components/SymbolBoard";
import MomentBar, { MAX_SYMBOLS } from "./components/MomentBar";
import { SYMBOLS_BY_ID } from "./data/symbols";

type Theme = "default" | "high-contrast";

export default function App() {
  const [theme, setTheme] = useState<Theme>("default");
  const [fontScale, setFontScale] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "high-contrast") root.setAttribute("data-theme", "high-contrast");
    else root.removeAttribute("data-theme");
    root.style.setProperty("--font-scale", String(fontScale));
  }, [theme, fontScale]);

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

  return (
    <div className="min-h-full flex flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b border-border bg-surface px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold">Tell My Day</h1>
        <div className="flex items-center gap-3" role="group" aria-label="Display settings">
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
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
        <MomentBar
          selectedIds={selectedIds}
          onRemove={removeSymbol}
          onMove={moveSymbol}
          onClear={clearSymbols}
        />
        <SymbolBoard selectedIds={selectedIds} onToggle={toggleSymbol} />
      </main>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <footer className="border-t border-border bg-surface px-6 py-3 text-sm text-muted">
        <p>
          Built by a direct support professional. All profile content is synthetic and fictional.
        </p>
      </footer>
    </div>
  );
}
