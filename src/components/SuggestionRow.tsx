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
  /** When set, shows an inline ask-AI discussion under the explanation. */
  onAsk?: (question: string) => Promise<void>;
  asking?: boolean;
}

export function SuggestionRow({
  suggestion,
  defaultExpanded = false,
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
    <div className="border-b border-paper-line/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full py-3 text-left sm:min-h-0"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-1.5">
          <svg
            className={`h-3 w-3 shrink-0 text-pen transition-transform ${
              expanded ? "rotate-90" : ""
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
        </div>
        <p className="mt-0.5 pl-[18px] break-words font-mono text-base text-ink-700 sm:truncate">
          {suggestion.original}
        </p>
      </button>

      {expanded && (
        <div className="space-y-2 pb-3 pl-[18px] font-mono text-base leading-relaxed">
          <p>
            <span className="text-ink-500">→ </span>
            <span className="text-ink-900">{suggestion.suggestion}</span>
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
            />
          )}
        </div>
      )}
    </div>
  );
}
