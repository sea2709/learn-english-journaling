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
      <div className="notebook-margin relative pl-12">
        {isAnalyzing && (
          <div className="absolute right-0 top-0 text-[11px] text-pen">
            checking…
          </div>
        )}
        {stale && !isAnalyzing && (
          <div className="absolute right-0 top-0 text-[11px] text-pen/70">
            edited
          </div>
        )}

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
          className="w-full resize-none overflow-hidden border-0 bg-transparent py-2 font-mono text-[15px] leading-[1.75] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
        />
      </div>

      {hasNotes && paragraph.analysis && (
        <div className="ml-12 mt-1 border-l-2 border-pen/30 pl-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNotesExpanded((v) => !v);
            }}
            className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-pen"
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
            {paragraph.analysis.suggestions.length} note
            {paragraph.analysis.suggestions.length === 1 ? "" : "s"}
          </button>

          {notesExpanded && (
            <div className="mt-2 space-y-0">
              <p className="mb-2 font-mono text-xs leading-relaxed text-ink-600">
                {paragraph.analysis.summary}
              </p>
              {paragraph.analysis.suggestions.map((suggestion, i) => (
                <SuggestionRow key={`${suggestion.original}-${i}`} suggestion={suggestion} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
