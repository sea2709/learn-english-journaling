"use client";

import { useState } from "react";
import {
  MAX_SUGGESTION_DISCUSSION_MESSAGES,
  MAX_SUGGESTION_MESSAGE_LENGTH,
} from "@/lib/suggestion-discussion";
import type {
  Suggestion,
  SuggestionCategory,
  SuggestionMessage,
} from "@/lib/types";

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
            <SuggestionDiscussion
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

function SuggestionDiscussion({
  discussion,
  draft,
  onDraftChange,
  onAsk,
  asking,
  canAsk,
  atLimit,
  error,
}: {
  discussion: SuggestionMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAsk: () => void;
  asking: boolean;
  canAsk: boolean;
  atLimit: boolean;
  error: string | null;
}) {
  return (
    <div
      className="mt-3 space-y-2 border-t border-paper-line/50 pt-3"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-ink-500">
        Ask about this
      </p>

      {discussion.length > 0 && (
        <ul className="space-y-2">
          {discussion.map((message, index) => (
            <li
              key={`${message.role}-${index}`}
              className={`rounded-sm px-2 py-1.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-ink-100/60 text-ink-800"
                  : "bg-sage-50/80 text-ink-700"
              }`}
            >
              <span className="mb-0.5 block font-sans text-[10px] font-medium uppercase tracking-wide text-ink-500">
                {message.role === "user" ? "You" : "Coach"}
              </span>
              <p className="whitespace-pre-wrap font-mono">{message.content}</p>
            </li>
          ))}
        </ul>
      )}

      {atLimit ? (
        <p className="font-sans text-xs text-ink-500">
          This conversation reached the {MAX_SUGGESTION_DISCUSSION_MESSAGES}
          -message limit. Re-Check the paragraph to start fresh notes.
        </p>
      ) : (
        <>
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void onAsk();
              }
            }}
            rows={2}
            maxLength={MAX_SUGGESTION_MESSAGE_LENGTH}
            disabled={asking}
            placeholder="Why is this better? When should I use it?"
            className="w-full resize-y rounded-sm border border-paper-line/70 bg-white/50 px-2 py-1.5 font-mono text-sm text-ink-800 placeholder:text-ink-400 focus:border-pen/40 focus:outline-none focus:ring-1 focus:ring-pen/30 disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-2">
            {error ? (
              <p className="font-sans text-xs text-coral-600" role="alert">
                {error}
              </p>
            ) : (
              <span className="font-sans text-[11px] text-ink-400">
                Ctrl+Enter to send
              </span>
            )}
            <button
              type="button"
              onClick={() => void onAsk()}
              disabled={!canAsk || !draft.trim()}
              className="feedback-btn px-3 py-1 text-xs disabled:opacity-50"
            >
              {asking ? "Asking…" : "Ask"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
