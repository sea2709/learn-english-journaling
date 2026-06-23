"use client";

import type { Suggestion, SuggestionCategory } from "@/lib/types";

const categoryMeta: Record<
  SuggestionCategory,
  { label: string; color: string; icon: string }
> = {
  grammar: { label: "Grammar", color: "bg-coral-100 text-coral-800", icon: "✎" },
  tone: { label: "Tone", color: "bg-purple-100 text-purple-800", icon: "♪" },
  "word-choice": {
    label: "Word choice",
    color: "bg-blue-100 text-blue-800",
    icon: "◈",
  },
  naturalness: {
    label: "Naturalness",
    color: "bg-sage-100 text-sage-800",
    icon: "✦",
  },
  punctuation: {
    label: "Punctuation",
    color: "bg-amber-100 text-amber-800",
    icon: "·",
  },
};

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const meta = categoryMeta[suggestion.category] ?? categoryMeta.grammar;

  return (
    <article className="rounded-xl border border-ink-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
        >
          <span aria-hidden>{meta.icon}</span>
          {meta.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium text-ink-500">Original: </span>
          <span className="line-through decoration-coral-300/80 text-ink-600">
            {suggestion.original}
          </span>
        </p>
        <p>
          <span className="font-medium text-sage-700">Better: </span>
          <span className="font-medium text-ink-900">{suggestion.suggestion}</span>
        </p>
        <p className="leading-relaxed text-ink-600">{suggestion.explanation}</p>
      </div>
    </article>
  );
}
