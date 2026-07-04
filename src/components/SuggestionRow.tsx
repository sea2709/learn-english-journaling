"use client";

import { useState } from "react";
import type { Suggestion, SuggestionCategory } from "@/lib/types";

const categoryLabels: Record<SuggestionCategory, string> = {
  grammar: "Grammar",
  tone: "Tone",
  "word-choice": "Word choice",
  naturalness: "Naturalness",
  punctuation: "Punctuation",
};

interface SuggestionRowProps {
  suggestion: Suggestion;
  defaultExpanded?: boolean;
}

export function SuggestionRow({
  suggestion,
  defaultExpanded = false,
}: SuggestionRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const label = categoryLabels[suggestion.category] ?? suggestion.category;

  return (
    <div className="border-b border-paper-line/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex min-h-11 w-full items-start gap-2 py-3 text-left sm:min-h-0"
        aria-expanded={expanded}
      >
        <svg
          className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-pen transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-pen">
            {label}
          </span>
          <p className="mt-0.5 break-words font-mono text-sm text-ink-700 sm:truncate">
            {suggestion.original}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 pb-3 pl-5 font-mono text-sm leading-relaxed">
          <p>
            <span className="text-ink-500">→ </span>
            <span className="text-ink-900">{suggestion.suggestion}</span>
          </p>
          <p className="text-xs leading-relaxed text-ink-600">
            {suggestion.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
