"use client";

import { useState } from "react";
import type { Suggestion, SuggestionCategory } from "@/lib/types";

const categoryMeta: Record<
  SuggestionCategory,
  { label: string; color: string; icon: string }
> = {
  grammar: { label: "Grammar", color: "bg-coral-100 text-coral-800", icon: "✎" },
  spelling: {
    label: "Spelling",
    color: "bg-rose-100 text-rose-800",
    icon: "Aa",
  },
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
  const [collapsed, setCollapsed] = useState(false);
  const meta = categoryMeta[suggestion.category] ?? categoryMeta.grammar;

  return (
    <article className="rounded-xl border border-ink-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 p-4 text-left"
        aria-expanded={!collapsed}
      >
        <svg
          className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${
            !collapsed ? "rotate-90" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
        >
          <span aria-hidden>{meta.icon}</span>
          {meta.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-ink-600">
          {suggestion.original}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-2 border-t border-ink-100 px-4 pb-4 pt-3 text-sm">
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
      )}
    </article>
  );
}
