"use client";

import type { AnalysisResult } from "@/lib/types";
import { SuggestionCard } from "./SuggestionCard";

interface FeedbackPanelProps {
  analysis: AnalysisResult | null;
  loading: boolean;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "text-sage-500" : score >= 60 ? "text-amber-500" : "text-coral-500";

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-ink-200"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-semibold text-ink-900">{score}</span>
        <p className="text-[10px] uppercase tracking-wide text-ink-500">Score</p>
      </div>
    </div>
  );
}

export function FeedbackPanel({ analysis, loading }: FeedbackPanelProps) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-ink-200/60 bg-white/70 p-8">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sage-200 border-t-sage-600" />
        <p className="font-medium text-ink-700">Analyzing your writing…</p>
        <p className="mt-1 text-sm text-ink-500">
          Checking grammar, tone, and naturalness
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white/50 p-8 text-center">
        <div className="mb-4 text-4xl opacity-40">✍️</div>
        <h3 className="font-serif text-lg font-medium text-ink-800">
          Your feedback will appear here
        </h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
          Write a paragraph and click &ldquo;Get feedback&rdquo; to receive suggestions on
          grammar, tone, word choice, and natural expression.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-6">
          <ScoreRing score={analysis.grammarScore} />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-ink-900">Overview</h3>
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium capitalize text-ink-700">
                {analysis.tone} tone
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-600">{analysis.summary}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-serif text-lg font-semibold text-ink-900">
          Polished version
        </h3>
        <p className="font-serif text-base leading-relaxed text-ink-800">
          {analysis.correctedText}
        </p>
      </div>

      {analysis.suggestions.length > 0 && (
        <div>
          <h3 className="mb-4 font-serif text-lg font-semibold text-ink-900">
            Suggestions ({analysis.suggestions.length})
          </h3>
          <div className="space-y-3">
            {analysis.suggestions.map((suggestion, index) => (
              <SuggestionCard key={`${suggestion.original}-${index}`} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
