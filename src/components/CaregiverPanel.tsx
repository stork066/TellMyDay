import { useEffect, useRef, useState } from "react";
import {
  fetchProfile,
  saveProfileSection,
  type ProfileSection,
  type ProfileSections,
} from "../lib/profileApi";

const SECTION_LABELS: Record<ProfileSection, string> = {
  people: "People",
  places: "Places",
  activities: "Activities",
  food: "Food",
  comfort: "Comfort",
};

type Props = {
  onClose: () => void;
};

export default function CaregiverPanel({ onClose }: Props) {
  const [pin, setPin] = useState("");
  const [sections, setSections] = useState<ProfileSections | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<Partial<Record<ProfileSection, string>>>({});
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pinRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setSections(await fetchProfile(pin));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function save(section: ProfileSection) {
    if (!sections) return;
    setSaveState((s) => ({ ...s, [section]: "Saving…" }));
    try {
      await saveProfileSection(pin, section, sections[section]);
      setSaveState((s) => ({
        ...s,
        [section]: "Saved ✓ — new facts may take a minute to reach stories.",
      }));
    } catch (err) {
      setSaveState((s) => ({
        ...s,
        [section]: err instanceof Error ? err.message : "Something went wrong.",
      }));
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
        aria-label="Caregiver settings"
        data-scan-exempt
        className="bg-surface text-fg border-4 border-accent rounded-2xl p-6 max-w-2xl w-full max-h-full overflow-auto"
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-2xl font-bold">Caregiver settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-tap px-5 py-2 rounded-xl border-2 border-border bg-surface text-lg font-semibold"
          >
            Close
          </button>
        </div>

        {!sections ? (
          <form onSubmit={unlock} className="mt-4">
            <p className="text-base text-muted mb-4">
              The "About Me" profile grounds every story. Editing it requires the caregiver PIN.
            </p>
            <label className="block text-lg font-semibold mb-2" htmlFor="caregiver-pin">
              Caregiver PIN
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="caregiver-pin"
                ref={pinRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="min-h-tap border-2 border-border rounded-lg px-3 py-2 bg-surface text-fg text-xl w-40"
              />
              <button
                type="submit"
                disabled={busy || pin.length === 0}
                className="min-h-tap px-6 py-2 rounded-xl bg-accent text-accent-fg text-lg font-bold border-2 border-accent disabled:opacity-50"
              >
                {busy ? "Checking…" : "Unlock"}
              </button>
            </div>
            <div aria-live="polite">
              {error && (
                <p className="text-lg mt-3" role="alert">
                  {error}
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="mt-2">
            <p className="text-base text-muted mb-4">
              Each section is plain text (markdown). Stories may only use facts written here —
              keep all content synthetic/fictional for the demo.
            </p>
            {(Object.keys(SECTION_LABELS) as ProfileSection[]).map((section) => (
              <div key={section} className="mb-6">
                <label className="block text-lg font-bold mb-1" htmlFor={`profile-${section}`}>
                  {SECTION_LABELS[section]}
                </label>
                <textarea
                  id={`profile-${section}`}
                  rows={8}
                  value={sections[section]}
                  onChange={(e) =>
                    setSections((prev) => prev && { ...prev, [section]: e.target.value })
                  }
                  className="w-full border-2 border-border rounded-lg px-3 py-2 bg-surface text-fg text-base leading-relaxed"
                />
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => save(section)}
                    disabled={saveState[section] === "Saving…" || sections[section].trim() === ""}
                    className="min-h-tap px-5 py-2 rounded-xl bg-accent text-accent-fg text-base font-bold border-2 border-accent disabled:opacity-50"
                  >
                    Save {SECTION_LABELS[section]}
                  </button>
                  <span aria-live="polite" className="text-base text-muted">
                    {saveState[section]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
