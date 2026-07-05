"use client";

import { useState } from "react";
import type { Suggestion, SuggestionCategory } from "@/lib/types";

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
        </div>
      )}
    </div>
  );
}
