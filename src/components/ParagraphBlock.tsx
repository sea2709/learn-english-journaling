"use client";

import { useEffect, useRef, useState } from "react";
import type { JournalParagraph } from "@/lib/types";
import { isParagraphStale } from "@/lib/entry-utils";
import { SuggestionRow } from "./SuggestionRow";

interface ParagraphBlockProps {
  paragraph: JournalParagraph;
  index: number;
  isActive: boolean;
  isWriting: boolean;
  isAnalyzing: boolean;
  focusSummary: string;
  preferencesLoading: boolean;
  onTextChange: (id: string, text: string) => void;
  onSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onSplit: (id: string, cursorPos: number) => void;
}

export function ParagraphBlock({
  paragraph,
  index,
  isActive,
  isWriting,
  isAnalyzing,
  focusSummary,
  preferencesLoading,
  onTextChange,
  onSelect,
  onAnalyze,
  onSplit,
}: ParagraphBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const stale = isParagraphStale(paragraph);
  const hasNotes = paragraph.analysis && !stale;
  const dimmed = isWriting && !isActive;
  const canCheck = Boolean(paragraph.text.trim());
  const noteCount = paragraph.analysis?.suggestions.length ?? 0;
  const notesLabel = `${noteCount} note${noteCount === 1 ? "" : "s"}`;

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [paragraph.text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (paragraph.text.trim()) {
        onAnalyze(paragraph.id);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const el = e.currentTarget;
      onSplit(paragraph.id, el.selectionStart);
    }
  };

  return (
    <div
      className={`group relative transition-opacity duration-200 ${
        dimmed ? "writing-dim" : ""
      }`}
      onClick={() => onSelect(paragraph.id)}
    >
      <div className="notebook-margin relative pl-14">
        <textarea
          ref={textareaRef}
          value={paragraph.text}
          onChange={(e) => onTextChange(paragraph.id, e.target.value)}
          onFocus={() => onSelect(paragraph.id)}
          onKeyDown={handleKeyDown}
          placeholder={
            index === 0
              ? "Start writing… Press Enter for a new paragraph."
              : "Continue writing…"
          }
          rows={1}
          className="w-full resize-none overflow-hidden border-0 bg-transparent py-2 font-mono text-lg leading-[1.75] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
        />
      </div>

      {canCheck && (
        <div className="mt-1 pl-14">
          <div className="flex items-center">
            {stale && !isAnalyzing && (
              <span className="text-[11px] text-pen/70">edited</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze(paragraph.id);
              }}
              disabled={isAnalyzing}
              className="feedback-btn ml-auto min-h-11 px-4 text-xs sm:min-h-0 sm:px-3 sm:py-1.5"
            >
              <span className="pen" aria-hidden>
                ✓
              </span>
              {isAnalyzing ? "Checking…" : "Check"}
            </button>
          </div>
          {isActive && !preferencesLoading && (
            <p className="mt-1 text-right font-sans text-xs text-ink-500">
              Check focus: {focusSummary}
            </p>
          )}
        </div>
      )}

      {hasNotes && paragraph.analysis && (
        <div className="ml-14 mt-1 border-l-2 border-pen/30 pl-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNotesExpanded((v) => !v);
            }}
            className="flex min-h-11 items-center gap-1.5 py-2 text-[11px] font-medium uppercase tracking-wide text-pen sm:min-h-0 sm:py-0"
            aria-expanded={notesExpanded}
          >
            <svg
              className={`h-3 w-3 transition-transform ${
                notesExpanded ? "rotate-90" : ""
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
            {notesLabel}
          </button>

          {notesExpanded && (
            <div className="mt-2 space-y-0">
              <div className="mb-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-500">
                  Polished version
                </p>
                <p className="font-mono text-sm leading-relaxed text-ink-800">
                  {paragraph.analysis.correctedText}
                </p>
              </div>
              <p className="mb-2 font-mono text-sm leading-relaxed text-ink-600">
                {paragraph.analysis.summary}
              </p>
              {paragraph.analysis.suggestions.map((suggestion, i) => (
                <SuggestionRow
                  key={`${suggestion.original}-${i}`}
                  suggestion={suggestion}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
