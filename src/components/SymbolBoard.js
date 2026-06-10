import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { SYMBOLS, SYMBOL_CATEGORIES } from "../data/symbols";
import SymbolButton from "./SymbolButton";
const CATEGORY_LABELS = {
    people: "People",
    places: "Places",
    activities: "Activities",
    feelings: "Feelings",
    food: "Food",
};
export default function SymbolBoard({ selectedIds, onToggle }) {
    const [category, setCategory] = useState("people");
    const tabRefs = useRef(new Map());
    function focusTab(cat) {
        setCategory(cat);
        tabRefs.current.get(cat)?.focus();
    }
    function onTabKeyDown(e, index) {
        const last = SYMBOL_CATEGORIES.length - 1;
        let next = null;
        if (e.key === "ArrowRight")
            next = index === last ? 0 : index + 1;
        else if (e.key === "ArrowLeft")
            next = index === 0 ? last : index - 1;
        else if (e.key === "Home")
            next = 0;
        else if (e.key === "End")
            next = last;
        if (next !== null) {
            e.preventDefault();
            focusTab(SYMBOL_CATEGORIES[next]);
        }
    }
    const visible = SYMBOLS.filter((s) => s.category === category);
    return (_jsxs("section", { "aria-label": "Symbol board", children: [_jsx("div", { role: "tablist", "aria-label": "Symbol categories", className: "flex flex-wrap gap-2 mb-4", children: SYMBOL_CATEGORIES.map((cat, i) => {
                    const active = cat === category;
                    return (_jsx("button", { ref: (el) => {
                            if (el)
                                tabRefs.current.set(cat, el);
                        }, role: "tab", id: `tab-${cat}`, "aria-selected": active, "aria-controls": `panel-${cat}`, tabIndex: active ? 0 : -1, onClick: () => setCategory(cat), onKeyDown: (e) => onTabKeyDown(e, i), className: `min-h-tap min-w-tap px-5 py-2 rounded-lg font-semibold text-lg border-2 ${active
                            ? "bg-accent text-accent-fg border-accent"
                            : "bg-surface text-fg border-border"}`, children: CATEGORY_LABELS[cat] }, cat));
                }) }), _jsx("div", { role: "tabpanel", id: `panel-${category}`, "aria-labelledby": `tab-${category}`, className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3", children: visible.map((s) => (_jsx(SymbolButton, { symbol: s, selected: selectedIds.includes(s.id), onToggle: onToggle }, s.id))) })] }));
}
