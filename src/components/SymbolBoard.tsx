import { useRef, useState } from "react";
import { SYMBOLS, SYMBOL_CATEGORIES, type SymbolCategory } from "../../api/src/shared/symbols";
import SymbolButton from "./SymbolButton";

const CATEGORY_LABELS: Record<SymbolCategory, string> = {
  people: "People",
  places: "Places",
  activities: "Activities",
  feelings: "Feelings",
  food: "Food",
};

type Props = {
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
};

export default function SymbolBoard({ selectedIds, onToggle }: Props) {
  const [category, setCategory] = useState<SymbolCategory>("people");
  const tabRefs = useRef<Map<SymbolCategory, HTMLButtonElement>>(new Map());

  function focusTab(cat: SymbolCategory) {
    setCategory(cat);
    tabRefs.current.get(cat)?.focus();
  }

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    const last = SYMBOL_CATEGORIES.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next !== null) {
      e.preventDefault();
      focusTab(SYMBOL_CATEGORIES[next]);
    }
  }

  const visible = SYMBOLS.filter((s) => s.category === category);

  return (
    <section aria-label="Symbol board">
      <div
        role="tablist"
        aria-label="Symbol categories"
        data-scan-group="categories"
        className="flex flex-wrap gap-2 mb-4"
      >
        {SYMBOL_CATEGORIES.map((cat, i) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              ref={(el) => {
                if (el) tabRefs.current.set(cat, el);
              }}
              role="tab"
              id={`tab-${cat}`}
              aria-selected={active}
              aria-controls={`panel-${cat}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setCategory(cat)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`min-h-tap min-w-tap px-5 py-2 rounded-lg font-semibold text-lg border-2 ${
                active
                  ? "bg-accent text-accent-fg border-accent"
                  : "bg-surface text-fg border-border"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${category}`}
        aria-labelledby={`tab-${category}`}
        data-scan-group="symbols"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
      >
        {visible.map((s) => (
          <SymbolButton
            key={s.id}
            symbol={s}
            selected={selectedIds.includes(s.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}
