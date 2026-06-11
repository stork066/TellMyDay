// Two-level single-switch scanning. Level 1 auto-scans the regions marked
// with [data-scan-group]; pressing the switch (Space, or a tap anywhere)
// enters the highlighted group. Level 2 scans the buttons inside it; the
// switch activates the highlighted button and returns to group scanning.
// Escape backs out of a group. Elements inside [data-scan-exempt] keep
// normal direct interaction (so scanning itself can be switched off).
//
// Highlighting is a plain outline (.scan-highlight) — no animation — so it
// works under reduced motion.

import { useEffect } from "react";

const ITEM_SELECTOR = "button:not(:disabled)";

function isVisible(el: HTMLElement): boolean {
  return el.offsetParent !== null && el.closest("[inert]") === null;
}

export function useSwitchScanning(enabled: boolean, intervalMs: number) {
  useEffect(() => {
    if (!enabled) return;

    let level: "groups" | "items" = "groups";
    let activeGroup: HTMLElement | null = null;
    let index = 0;
    let current: HTMLElement | null = null;

    function groups(): HTMLElement[] {
      return Array.from(document.querySelectorAll<HTMLElement>("[data-scan-group]")).filter(
        isVisible,
      );
    }
    function itemsOf(group: HTMLElement): HTMLElement[] {
      return Array.from(group.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(isVisible);
    }

    function clearHighlight() {
      current?.classList.remove("scan-highlight");
      current = null;
    }
    function highlight(el: HTMLElement | undefined) {
      clearHighlight();
      if (!el) return;
      el.classList.add("scan-highlight");
      el.scrollIntoView({ block: "nearest" });
      current = el;
    }

    // The scanned group can disappear (e.g. story re-rendered); fall back
    // to group level instead of scanning a stale list.
    function currentList(): HTMLElement[] {
      if (level === "items" && activeGroup && document.contains(activeGroup)) {
        const items = itemsOf(activeGroup);
        if (items.length > 0) return items;
      }
      level = "groups";
      activeGroup = null;
      return groups();
    }

    function tick(advance: boolean) {
      const list = currentList();
      if (list.length === 0) {
        clearHighlight();
        return;
      }
      index = (advance ? index + 1 : index) % list.length;
      highlight(list[index]);
    }

    let timer = window.setInterval(() => tick(true), intervalMs);
    function restartTimer() {
      window.clearInterval(timer);
      timer = window.setInterval(() => tick(true), intervalMs);
    }

    function backToGroups(fromGroup: HTMLElement | null) {
      const g = groups();
      index = fromGroup ? Math.max(0, g.indexOf(fromGroup)) : 0;
      level = "groups";
      activeGroup = null;
      tick(false);
    }

    function select() {
      const list = currentList();
      if (list.length === 0) return;
      const el = list[index % list.length];
      if (level === "groups") {
        level = "items";
        activeGroup = el;
        index = 0;
        tick(false);
      } else {
        el.click();
        backToGroups(activeGroup);
      }
      restartTimer();
    }

    function isExempt(target: EventTarget | null): boolean {
      return target instanceof Element && target.closest("[data-scan-exempt]") !== null;
    }

    // Space must work as the switch regardless of which element happens to
    // hold focus (e.g. the header toggle that turned scanning on). Only two
    // exceptions: real text/select inputs keep Space for typing, and when no
    // scan groups are available (a dialog is open) Space stays native so
    // focused buttons still work.
    function isTypingTarget(target: EventTarget | null): boolean {
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.code === "Space") {
        if (isTypingTarget(e.target)) return;
        if (currentList().length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        select();
      } else if (e.key === "Escape" && level === "items") {
        e.preventDefault();
        backToGroups(activeGroup);
        restartTimer();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (isExempt(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      select();
    }
    // Swallow the trusted click that follows a pointerdown on a real control;
    // our programmatic el.click() (isTrusted: false) passes through.
    function onClickCapture(e: MouseEvent) {
      if (!e.isTrusted || isExempt(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClickCapture, true);
    tick(false);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClickCapture, true);
      clearHighlight();
    };
  }, [enabled, intervalMs]);
}
