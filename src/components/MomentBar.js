import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { SYMBOLS_BY_ID } from "../data/symbols";
export const MAX_SYMBOLS = 8;
export const MIN_SYMBOLS = 3;
export default function MomentBar({ selectedIds, onRemove, onMove, onClear }) {
    function onChipKeyDown(e, index) {
        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            onMove(index, -1);
        }
        else if (e.key === "ArrowRight" && index < selectedIds.length - 1) {
            e.preventDefault();
            onMove(index, 1);
        }
        else if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            onRemove(selectedIds[index]);
        }
    }
    return (_jsxs("section", { "aria-label": "Your moment", className: "bg-surface border-2 border-border rounded-xl p-4 mb-6", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 mb-3", children: [_jsxs("h2", { className: "text-xl font-bold", children: ["Your moment", " ", _jsxs("span", { className: "text-muted font-normal text-base", children: ["(", selectedIds.length, " of ", MAX_SYMBOLS, " \u2014 pick ", MIN_SYMBOLS, " to ", MAX_SYMBOLS, ")"] })] }), selectedIds.length > 0 && (_jsx("button", { type: "button", onClick: onClear, className: "min-h-tap px-4 py-2 rounded-lg border-2 border-border bg-surface font-semibold", children: "Clear all" }))] }), selectedIds.length === 0 ? (_jsx("p", { className: "text-lg text-muted", children: "Tap symbols below to build your moment." })) : (_jsxs(_Fragment, { children: [_jsx("p", { id: "moment-help", className: "sr-only", children: "Press Enter or Delete to remove a symbol. Press left or right arrow to move it." }), _jsx("ol", { "aria-describedby": "moment-help", className: "flex flex-wrap gap-3 list-none", children: selectedIds.map((id, i) => {
                            const s = SYMBOLS_BY_ID[id];
                            return (_jsx("li", { children: _jsxs("button", { type: "button", "aria-label": `${s.label}, ${i + 1} of ${selectedIds.length}. Remove from your moment.`, onClick: () => onRemove(id), onKeyDown: (e) => onChipKeyDown(e, i), className: "flex flex-col items-center gap-1 min-h-tap min-w-tap p-2 rounded-xl border-2 border-accent bg-surface", children: [_jsx("img", { src: s.file, alt: "", className: "w-12 h-12" }), _jsxs("span", { className: "text-base font-semibold flex items-center gap-1", children: [s.label, _jsx("span", { "aria-hidden": "true", className: "text-muted", children: "\u2715" })] })] }) }, id));
                        }) })] }))] }));
}
