import { SYMBOLS_BY_ID } from "../../api/src/shared/symbols";

export const MAX_SYMBOLS = 8;
export const MIN_SYMBOLS = 3;

type Props = {
  selectedIds: readonly string[];
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onClear: () => void;
};

export default function MomentBar({ selectedIds, onRemove, onMove, onClear }: Props) {
  function onChipKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      onMove(index, -1);
    } else if (e.key === "ArrowRight" && index < selectedIds.length - 1) {
      e.preventDefault();
      onMove(index, 1);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove(selectedIds[index]);
    }
  }

  return (
    <section
      aria-label="Your moment"
      data-scan-group="moment"
      className="bg-surface border-2 border-border rounded-xl p-4 mb-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold">
          Your moment{" "}
          <span className="text-muted font-normal text-base">
            ({selectedIds.length} of {MAX_SYMBOLS} — pick {MIN_SYMBOLS} to {MAX_SYMBOLS})
          </span>
        </h2>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-tap px-4 py-2 rounded-lg border-2 border-border bg-surface font-semibold"
          >
            Clear all
          </button>
        )}
      </div>

      {selectedIds.length === 0 ? (
        <p className="text-lg text-muted">Tap symbols below to build your moment.</p>
      ) : (
        <>
          <p id="moment-help" className="sr-only">
            Press Enter or Delete to remove a symbol. Press left or right arrow to move it.
          </p>
          <ol aria-describedby="moment-help" className="flex flex-wrap gap-3 list-none">
            {selectedIds.map((id, i) => {
              const s = SYMBOLS_BY_ID[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-label={`${s.label}, ${i + 1} of ${selectedIds.length}. Remove from your moment.`}
                    onClick={() => onRemove(id)}
                    onKeyDown={(e) => onChipKeyDown(e, i)}
                    className="flex flex-col items-center gap-1 min-h-tap min-w-tap p-2 rounded-xl border-2 border-accent bg-surface"
                  >
                    <img src={s.file} alt="" className="w-12 h-12" />
                    <span className="text-base font-semibold flex items-center gap-1">
                      {s.label}
                      <span aria-hidden="true" className="text-muted">
                        ✕
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
