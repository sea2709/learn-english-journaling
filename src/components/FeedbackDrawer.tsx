"use client";

import { useEffect } from "react";
import type { EntryReviewResult } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { SuggestionRow } from "./SuggestionRow";

interface FeedbackDrawerProps {
  open: boolean;
  review: EntryReviewResult | null;
  loading: boolean;
  onClose: () => void;
  onRequestReview: () => void;
}

export function FeedbackDrawer({
  open,
  review,
  loading,
  onClose,
  onRequestReview,
}: FeedbackDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in bg-ink-950/25"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[calc(100vw-2rem)] animate-drawer-in-right flex-col bg-paper shadow-xl max-[560px]:w-full"
        role="dialog"
        aria-label="Entry feedback"
      >
        <header className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Feedback
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-ink-500 transition hover:bg-paper-dark hover:text-ink-800"
            aria-label="Close feedback"
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-paper-line border-t-pen" />
              <p className="font-display text-sm font-medium text-ink-700">
                Reviewing your entry…
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Checking grammar, tone, and flow
              </p>
            </div>
          ) : !review ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-base font-medium text-ink-800">
                Full-entry review
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
                Get AI feedback on your entire journal entry — grammar, tone,
                word choice, and flow across all paragraphs.
              </p>
              <button
                type="button"
                onClick={onRequestReview}
                className="mt-6 rounded border border-pen/30 bg-white/60 px-5 py-2.5 text-sm font-medium text-pen transition hover:bg-white"
              >
                Review entry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <div className="flex items-start gap-4">
                  <ScoreRing score={review.grammarScore} size="sm" />
                  <div className="min-w-0 flex-1 pt-1">
                    <span className="inline-block rounded bg-paper-dark px-2 py-0.5 text-[11px] font-medium capitalize text-ink-600">
                      {review.tone} tone
                    </span>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {review.summary}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-2 font-display text-sm font-semibold text-ink-800">
                  Polished version
                </h3>
                <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink-700">
                  {review.correctedText}
                </p>
              </section>

              {review.suggestions.length > 0 && (
                <section>
                  <h3 className="mb-1 font-display text-sm font-semibold text-ink-800">
                    Suggestions ({review.suggestions.length})
                  </h3>
                  <div>
                    {review.suggestions.map((suggestion, index) => (
                      <SuggestionRow
                        key={`${suggestion.original}-${index}`}
                        suggestion={suggestion}
                      />
                    ))}
                  </div>
                </section>
              )}

              <button
                type="button"
                onClick={onRequestReview}
                className="w-full rounded border border-paper-line bg-white/50 py-2 text-sm text-ink-600 transition hover:bg-white"
              >
                Re-run review
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
