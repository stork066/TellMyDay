import type { SymbolEntry } from "../data/symbols";

type Props = {
  symbol: SymbolEntry;
  selected: boolean;
  onToggle: (id: string) => void;
};

export default function SymbolButton({ symbol, selected, onToggle }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(symbol.id)}
      className={`relative flex flex-col items-center justify-center gap-2 min-h-tap min-w-tap p-3 rounded-xl bg-surface ${
        selected ? "border-4 border-accent" : "border-2 border-border"
      }`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 bg-accent text-accent-fg rounded-full w-7 h-7 flex items-center justify-center font-bold text-base"
        >
          ✓
        </span>
      )}
      <img src={symbol.file} alt="" className="w-16 h-16" />
      <span className="text-base font-semibold text-center leading-tight">{symbol.label}</span>
    </button>
  );
}
