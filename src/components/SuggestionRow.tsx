"use client";

import { useState } from "react";
import { MAX_SUGGESTION_DISCUSSION_MESSAGES } from "@/lib/suggestion-discussion";
import type { Suggestion, SuggestionCategory } from "@/lib/types";
import { DiscussionThread } from "./DiscussionThread";

const categoryLabels: Record<SuggestionCategory, string> = {
  grammar: "Grammar",
  spelling: "Spelling",
  tone: "Tone",
  "word-choice": "Word choice",
  naturalness: "Naturalness",
  punctuation: "Punctuation",
};

interface SuggestionRowProps {
  suggestion: Suggestion;
  defaultExpanded?: boolean;
  /** When true, forces the row open (e.g. matching in-text highlight). */
  forceExpanded?: boolean;
  /** Visual link state when this note is focused from a highlight (or vice versa). */
  anchored?: boolean;
  /** DOM id for scroll/anchor targets. */
  anchorId?: string;
  /** When set, shows an "In text" control that jumps to the highlight. */
  onRevealInText?: () => void;
  /** When set, shows an inline ask-AI discussion under the explanation. */
  onAsk?: (question: string) => Promise<void>;
  asking?: boolean;
}

export function SuggestionRow({
  suggestion,
  defaultExpanded = false,
  forceExpanded = false,
  anchored = false,
  anchorId,
  onRevealInText,
  onAsk,
  asking = false,
}: SuggestionRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const label = categoryLabels[suggestion.category] ?? suggestion.category;
  const discussion = suggestion.discussion ?? [];
  // Reserve room for the next user + assistant pair.
  const atLimit = discussion.length + 2 > MAX_SUGGESTION_DISCUSSION_MESSAGES;
  const canAsk = Boolean(onAsk) && !asking && !atLimit;
  const isExpanded = expanded || forceExpanded;

  const handleAsk = async () => {
    if (!onAsk || asking || atLimit) return;

    const question = draft.trim();
    if (!question) {
      setLocalError("Write a question first.");
      return;
    }

    setLocalError(null);
    try {
      await onAsk(question);
      setDraft("");
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to get a reply."
      );
    }
  };

  return (
    <div
      id={anchorId}
      className={`scroll-mt-24 border-b border-paper-line/60 px-2 last:border-b-0 sm:px-3 ${
        anchored ? "suggestion-note--anchored" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-1 pt-2.5">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="-ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-1 text-left"
          aria-expanded={isExpanded}
        >
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-pen transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-[11px] font-medium uppercase tracking-wide text-pen">
            {label}
          </span>
        </button>

        {onRevealInText && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRevealInText();
            }}
            className="shrink-0 font-sans text-xs text-ink-500 no-underline hover:text-pen hover:underline hover:decoration-pen/60 hover:underline-offset-2"
            title="Show in paragraph"
          >
            In text
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-1 pb-2.5 text-left"
        aria-expanded={isExpanded}
      >
        <p className="line-clamp-2 pl-5 font-mono text-base text-ink-700">
          {suggestion.original}
        </p>
      </button>

      {isExpanded && (
        <div className="space-y-2.5 pb-3 pl-5 font-mono text-base leading-relaxed">
          <p>
            <span className="text-ink-500">→ </span>
            <span className="font-medium text-ink-900">
              {suggestion.suggestion}
            </span>
          </p>
          <p className="text-sm leading-relaxed text-ink-600">
            {suggestion.explanation}
          </p>

          {onAsk && (
            <DiscussionThread
              discussion={discussion}
              draft={draft}
              onDraftChange={(value) => {
                setDraft(value);
                if (localError) setLocalError(null);
              }}
              onAsk={handleAsk}
              asking={asking}
              canAsk={canAsk}
              atLimit={atLimit}
              error={localError}
              compactComposer
              className="mt-4 space-y-2 border-t border-paper-line/50 pt-3"
            />
          )}
        </div>
      )}
    </div>
  );
}
