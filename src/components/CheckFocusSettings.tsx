"use client";

import { useEffect, useState } from "react";
import {
  ALL_FOCUS_AREAS,
  FOCUS_AREA_LABELS,
} from "@/lib/analysis-preferences";
import type { AnalysisFocusArea, AnalysisPreferences } from "@/lib/types";

interface CheckFocusSettingsProps {
  open: boolean;
  preferences: AnalysisPreferences;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (preferences: AnalysisPreferences) => void;
}

export function CheckFocusSettings({
  open,
  preferences,
  saving,
  error,
  onClose,
  onSave,
}: CheckFocusSettingsProps) {
  const [focusAreas, setFocusAreas] = useState<AnalysisFocusArea[]>(
    preferences.focusAreas
  );
  const [customNote, setCustomNote] = useState(preferences.customNote ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setFocusAreas(preferences.focusAreas);
    setCustomNote(preferences.customNote ?? "");
    setValidationError(null);
  }, [open, preferences]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const toggleFocusArea = (area: AnalysisFocusArea) => {
    setFocusAreas((current) => {
      if (current.includes(area)) {
        return current.filter((value) => value !== area);
      }
      return [...current, area];
    });
    setValidationError(null);
  };

  const handleSave = () => {
    if (focusAreas.length === 0) {
      setValidationError("Select at least one focus area.");
      return;
    }

    onSave({
      focusAreas,
      customNote: customNote.trim() || undefined,
    });
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in bg-ink-950/25"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full animate-drawer-in-right flex-col bg-paper shadow-xl sm:w-[380px] sm:max-w-[calc(100vw-2rem)]"
        role="dialog"
        aria-label="Check focus settings"
      >
        <header className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Check focus
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded p-1.5 text-ink-500 transition hover:bg-paper-dark hover:text-ink-800 sm:min-h-0 sm:min-w-0"
            aria-label="Close check focus settings"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm leading-relaxed text-ink-600">
            Choose what the AI emphasizes when you check a paragraph or review
            your full entry.
          </p>

          <fieldset className="mt-6 space-y-3">
            <legend className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-500">
              Focus areas
            </legend>
            {ALL_FOCUS_AREAS.map((area) => (
              <label
                key={area}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded border border-paper-line/80 px-3 py-2 transition hover:bg-paper-dark/60 sm:min-h-0"
              >
                <input
                  type="checkbox"
                  checked={focusAreas.includes(area)}
                  onChange={() => toggleFocusArea(area)}
                  className="h-4 w-4 rounded border-ink-300 text-pen focus:ring-pen/30"
                />
                <span className="text-sm font-medium text-ink-800">
                  {FOCUS_AREA_LABELS[area]}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="mt-6">
            <label
              htmlFor="learning-goal"
              className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
            >
              Learning goal (optional)
            </label>
            <textarea
              id="learning-goal"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder='e.g. "Preparing for IELTS writing"'
              className="w-full resize-none rounded border border-paper-line bg-white/80 px-3 py-2 font-sans text-sm text-ink-800 placeholder:text-ink-400 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
            />
            <p className="mt-1 text-right text-[11px] text-ink-400">
              {customNote.length}/300
            </p>
          </div>

          {(validationError || error) && (
            <p className="mt-4 rounded bg-coral-100/60 px-3 py-2 text-sm text-coral-800">
              {validationError ?? error}
            </p>
          )}
        </div>

        <footer className="border-t border-paper-line px-5 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="feedback-btn w-full justify-center"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </footer>
      </aside>
    </>
  );
}
