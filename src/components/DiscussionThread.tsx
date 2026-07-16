"use client";

import { useState } from "react";
import {
  MAX_SUGGESTION_DISCUSSION_MESSAGES,
  MAX_SUGGESTION_MESSAGE_LENGTH,
} from "@/lib/suggestion-discussion";
import type { SuggestionMessage } from "@/lib/types";

interface DiscussionThreadProps {
  discussion: SuggestionMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAsk: () => void;
  asking: boolean;
  canAsk: boolean;
  atLimit: boolean;
  error: string | null;
  label?: string;
  placeholder?: string;
  atLimitMessage?: string;
  submitLabel?: string;
  submittingLabel?: string;
  /** Outer wrapper classes; defaults to inline-under-suggestion styling. */
  className?: string;
  /** Classes for the scrollable message list (e.g. overflow in a popover). */
  messagesClassName?: string;
  /** When true, each message can collapse; latest stays open by default. */
  collapsibleMessages?: boolean;
  /**
   * Compact composer for tight popovers: input + icon send on one row,
   * Enter to send (Shift+Enter for newline), no shortcut hint.
   */
  compactComposer?: boolean;
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
      />
    </svg>
  );
}

export function DiscussionThread({
  discussion,
  draft,
  onDraftChange,
  onAsk,
  asking,
  canAsk,
  atLimit,
  error,
  label = "Ask about this",
  placeholder = "Why is this better? When should I use it?",
  atLimitMessage = `This conversation reached the ${MAX_SUGGESTION_DISCUSSION_MESSAGES}-message limit. Re-Check the paragraph to start fresh notes.`,
  submitLabel = "Ask",
  submittingLabel = "Asking…",
  className = "mt-3 space-y-2 border-t border-paper-line/50 pt-3",
  messagesClassName = "space-y-2",
  collapsibleMessages = false,
  compactComposer = false,
}: DiscussionThreadProps) {
  // Explicit toggles only; unset indexes use the default (latest expanded).
  const [expandedByIndex, setExpandedByIndex] = useState<
    Record<number, boolean>
  >({});

  const isExpanded = (index: number) => {
    if (!collapsibleMessages) return true;
    if (Object.prototype.hasOwnProperty.call(expandedByIndex, index)) {
      return expandedByIndex[index];
    }
    return index === discussion.length - 1;
  };

  const toggleExpanded = (index: number) => {
    setExpandedByIndex((prev) => ({
      ...prev,
      [index]: !isExpanded(index),
    }));
  };

  const handleComposerKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key !== "Enter") return;

    if (compactComposer) {
      if (e.shiftKey) return;
      e.preventDefault();
      void onAsk();
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      void onAsk();
    }
  };

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <p className="shrink-0 font-sans text-[11px] font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>

      {discussion.length > 0 && (
        <ul className={messagesClassName}>
          {discussion.map((message, index) => {
            const expanded = isExpanded(index);
            const roleLabel = message.role === "user" ? "You" : "Coach";
            const toneClass =
              message.role === "user"
                ? "bg-ink-100/60 text-ink-800"
                : "bg-sage-50/80 text-ink-700";

            if (!collapsibleMessages) {
              return (
                <li
                  key={`${message.role}-${index}`}
                  className={`rounded-sm px-2 py-1.5 text-sm leading-relaxed ${toneClass}`}
                >
                  <span className="mb-0.5 block font-sans text-[10px] font-medium uppercase tracking-wide text-ink-500">
                    {roleLabel}
                  </span>
                  <p className="whitespace-pre-wrap font-mono">
                    {message.content}
                  </p>
                </li>
              );
            }

            return (
              <li
                key={`${message.role}-${index}`}
                className={`rounded-sm text-sm leading-relaxed ${toneClass}`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(index)}
                  aria-expanded={expanded}
                  className="flex w-full items-start gap-1.5 px-2 py-1.5 text-left"
                >
                  <svg
                    className={`mt-0.5 h-3 w-3 shrink-0 text-ink-500 transition-transform ${
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
                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 block font-sans text-[10px] font-medium uppercase tracking-wide text-ink-500">
                      {roleLabel}
                    </span>
                    <p
                      className={`font-mono ${
                        expanded
                          ? "whitespace-pre-wrap"
                          : "line-clamp-2 whitespace-normal"
                      }`}
                    >
                      {message.content}
                    </p>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="shrink-0 space-y-2">
        {atLimit ? (
          <p className="font-sans text-xs text-ink-500">{atLimitMessage}</p>
        ) : compactComposer ? (
          <>
            <div className="flex items-start gap-2">
              <textarea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                rows={2}
                maxLength={MAX_SUGGESTION_MESSAGE_LENGTH}
                disabled={asking}
                placeholder={placeholder}
                className="min-w-0 flex-1 resize-none rounded-sm border border-paper-line/70 bg-white/50 px-2 py-1.5 font-mono text-sm text-ink-800 placeholder:text-ink-400 focus:border-pen/40 focus:outline-none focus:ring-1 focus:ring-pen/30 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void onAsk()}
                disabled={!canAsk || !draft.trim()}
                aria-label={asking ? submittingLabel : submitLabel}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-pen px-2.5 py-2 text-white transition-opacity hover:bg-pen/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {asking ? (
                  <span className="text-xs text-white" aria-hidden>
                    …
                  </span>
                ) : (
                  <SendIcon className="h-4 w-4 text-white" />
                )}
              </button>
            </div>
            {error && (
              <p className="font-sans text-xs text-coral-600" role="alert">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              rows={2}
              maxLength={MAX_SUGGESTION_MESSAGE_LENGTH}
              disabled={asking}
              placeholder={placeholder}
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
                {asking ? submittingLabel : submitLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
