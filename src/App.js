import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import SymbolBoard from "./components/SymbolBoard";
import MomentBar, { MAX_SYMBOLS } from "./components/MomentBar";
import { SYMBOLS_BY_ID } from "./data/symbols";
export default function App() {
    const [theme, setTheme] = useState("default");
    const [fontScale, setFontScale] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [announcement, setAnnouncement] = useState("");
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "high-contrast")
            root.setAttribute("data-theme", "high-contrast");
        else
            root.removeAttribute("data-theme");
        root.style.setProperty("--font-scale", String(fontScale));
    }, [theme, fontScale]);
    function toggleSymbol(id) {
        const label = SYMBOLS_BY_ID[id].label;
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((s) => s !== id));
            setAnnouncement(`Removed ${label}.`);
        }
        else if (selectedIds.length >= MAX_SYMBOLS) {
            setAnnouncement(`Your moment is full. Remove a symbol before adding ${label}.`);
        }
        else {
            setSelectedIds([...selectedIds, id]);
            setAnnouncement(`Added ${label}.`);
        }
    }
    function removeSymbol(id) {
        setSelectedIds(selectedIds.filter((s) => s !== id));
        setAnnouncement(`Removed ${SYMBOLS_BY_ID[id].label}.`);
    }
    function moveSymbol(index, direction) {
        const next = [...selectedIds];
        const target = index + direction;
        [next[index], next[target]] = [next[target], next[index]];
        setSelectedIds(next);
        setAnnouncement(`${SYMBOLS_BY_ID[next[target]].label} moved to position ${target + 1} of ${next.length}.`);
    }
    function clearSymbols() {
        setSelectedIds([]);
        setAnnouncement("Cleared your moment.");
    }
    return (_jsxs("div", { className: "min-h-full flex flex-col", children: [_jsx("a", { href: "#main", className: "skip-link", children: "Skip to main content" }), _jsxs("header", { className: "border-b border-border bg-surface px-6 py-4 flex flex-wrap items-center gap-4 justify-between", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Tell My Day" }), _jsxs("div", { className: "flex items-center gap-3", role: "group", "aria-label": "Display settings", children: [_jsxs("label", { className: "text-base", children: [_jsx("span", { className: "sr-only", children: "Text size" }), _jsxs("select", { "aria-label": "Text size", className: "min-h-tap min-w-tap border-2 border-border rounded-lg px-3 py-2 bg-surface text-fg", value: fontScale, onChange: (e) => setFontScale(Number(e.target.value)), children: [_jsx("option", { value: 0.9, children: "Small" }), _jsx("option", { value: 1, children: "Medium" }), _jsx("option", { value: 1.25, children: "Large" }), _jsx("option", { value: 1.5, children: "Extra large" })] })] }), _jsx("button", { type: "button", "aria-pressed": theme === "high-contrast", onClick: () => setTheme(theme === "high-contrast" ? "default" : "high-contrast"), className: "min-h-tap min-w-tap border-2 border-border rounded-lg px-4 py-2 bg-surface font-semibold", children: "High contrast" })] })] }), _jsxs("main", { id: "main", tabIndex: -1, className: "flex-1 px-6 py-8 max-w-5xl w-full mx-auto", children: [_jsx(MomentBar, { selectedIds: selectedIds, onRemove: removeSymbol, onMove: moveSymbol, onClear: clearSymbols }), _jsx(SymbolBoard, { selectedIds: selectedIds, onToggle: toggleSymbol })] }), _jsx("div", { "aria-live": "polite", className: "sr-only", children: announcement }), _jsx("footer", { className: "border-t border-border bg-surface px-6 py-3 text-sm text-muted", children: _jsx("p", { children: "Built by a direct support professional. All profile content is synthetic and fictional." }) })] }));
}
