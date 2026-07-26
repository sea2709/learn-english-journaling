"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MAX_SUGGESTION_DISCUSSION_MESSAGES } from "@/lib/suggestion-discussion";
import type { Suggestion, SuggestionCategory } from "@/lib/types";
import { DiscussionThread } from "./DiscussionThread";
import { suggestionMarkDomId } from "@/lib/suggestion-anchors";

const categoryLabels: Record<SuggestionCategory, string> = {
  grammar: "Grammar",
  spelling: "Spelling",
  tone: "Tone",
  "word-choice": "Word choice",
  naturalness: "Naturalness",
  punctuation: "Punctuation",
};

interface SuggestionHighlightProps {
  suggestion: Suggestion;
  text: string;
  /** Character offset of this mark in the paragraph text. */
  startOffset: number;
  interactive: boolean;
  active: boolean;
  /** Brief flash when jumped to from the notes list. */
  pulsing?: boolean;
  onActivate: (suggestionId: string | null) => void;
  /** Place the textarea caret for editing (single click / tap). */
  onPlaceCaret: (offset: number) => void;
  /** Jump to the matching note in the list below. */
  onRevealInNotes?: () => void;
  onAsk?: (question: string) => Promise<void>;
  asking?: boolean;
}

interface PanelCoords {
  top?: number;
  bottom?: number;
  left: number;
  maxHeight: number;
}

export function SuggestionHighlight({
  suggestion,
  text,
  startOffset,
  interactive,
  active,
  pulsing = false,
  onActivate,
  onPlaceCaret,
  onRevealInNotes,
  onAsk,
  asking = false,
}: SuggestionHighlightProps) {
  const markRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [hovering, setHovering] = useState(false);
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOpenedRef = useRef(false);

  const label = categoryLabels[suggestion.category] ?? suggestion.category;
  const discussion = suggestion.discussion ?? [];
  const atLimit = discussion.length + 2 > MAX_SUGGESTION_DISCUSSION_MESSAGES;
  const canAsk = Boolean(onAsk) && !asking && !atLimit;
  const showPreview = interactive && hovering && !active;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!active) {
      setCoords(null);
      return;
    }

    const GAP = 8;
    const PANEL_WIDTH = Math.min(320, window.innerWidth - 16);

    const updatePosition = () => {
      const mark = markRef.current;
      if (!mark) return;

      const rect = mark.getBoundingClientRect();
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - GAP);
      const spaceAbove = Math.max(0, rect.top - GAP);
      const placement =
        spaceBelow >= 220 || spaceBelow >= spaceAbove ? "below" : "above";
      const maxHeight = Math.max(
        160,
        placement === "below" ? spaceBelow : spaceAbove
      );

      let left = rect.left;
      left = Math.min(left, window.innerWidth - PANEL_WIDTH - 8);
      left = Math.max(8, left);

      setCoords({
        top: placement === "below" ? rect.bottom + GAP : undefined,
        bottom:
          placement === "above"
            ? window.innerHeight - rect.top + GAP
            : undefined,
        left,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (markRef.current?.contains(target)) return;
      onActivate(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onActivate(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, onActivate]);

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

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const caretOffsetFromClientX = (clientX: number) => {
    const mark = markRef.current;
    if (!mark || text.length === 0) return startOffset;
    const rect = mark.getBoundingClientRect();
    if (rect.width <= 0) return startOffset;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return startOffset + Math.round(ratio * text.length);
  };

  const placeCaret = (clientX: number) => {
    onPlaceCaret(caretOffsetFromClientX(clientX));
  };

  const panel =
    active && coords && mounted
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={`${label} note`}
            className="fixed z-[60] flex w-[min(calc(100vw-2rem),20rem)] flex-col overflow-hidden rounded-sm border border-paper-line/80 bg-[rgb(250,247,240)] p-3 shadow-md"
            style={{
              left: coords.left,
              top: coords.top,
              bottom: coords.bottom,
              maxHeight: coords.maxHeight,
            }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-pen">
                {label}
              </p>
              {onRevealInNotes && (
                <button
                  type="button"
                  className="shrink-0 font-sans text-xs text-ink-500 no-underline hover:text-pen hover:underline hover:decoration-pen/60 hover:underline-offset-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRevealInNotes();
                  }}
                >
                  View in notes
                </button>
              )}
            </div>
            <p className="mt-1 font-mono text-sm leading-relaxed text-ink-700">
              {suggestion.original}
            </p>
            <p className="mt-1 font-mono text-sm leading-relaxed">
              <span className="text-ink-500">→ </span>
              <span className="text-ink-900">{suggestion.suggestion}</span>
            </p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-ink-600">
              {suggestion.explanation}
            </p>

            {onAsk && (
              <div className="mt-3 min-h-0 flex-1 border-t border-paper-line/60 pt-2">
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
                  compactComposer
                  collapsibleMessages
                  composerRows={4}
                  className="flex min-h-0 flex-col gap-2"
                  messagesClassName="max-h-40 space-y-2 overflow-y-auto overscroll-contain"
                />
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <span className="relative inline">
      <mark
        ref={markRef}
        id={suggestionMarkDomId(suggestion.id)}
        className={`suggestion-mark pointer-events-auto scroll-mt-24 rounded-[1px] ${
          interactive
            ? "cursor-text suggestion-mark--interactive"
            : "suggestion-mark--stale"
        } ${active ? "suggestion-mark--active" : ""} ${
          pulsing ? "suggestion-mark--pulse" : ""
        }`}
        title={interactive ? "Double-click or long-press for note" : undefined}
        onMouseEnter={() => {
          if (interactive) setHovering(true);
        }}
        onMouseLeave={() => setHovering(false)}
        onMouseDown={(event) => {
          if (!interactive || event.button !== 0) return;
          // Let double-click open the note; single click places the caret.
          if (event.detail >= 2) return;
          event.preventDefault();
          event.stopPropagation();
          placeCaret(event.clientX);
        }}
        onClick={(event) => {
          if (!interactive) return;
          event.preventDefault();
          event.stopPropagation();
          if (longPressOpenedRef.current) {
            longPressOpenedRef.current = false;
            return;
          }
          // Single click already placed caret on mousedown.
        }}
        onDoubleClick={(event) => {
          if (!interactive) return;
          event.preventDefault();
          event.stopPropagation();
          onActivate(active ? null : suggestion.id);
        }}
        onTouchStart={(event) => {
          if (!interactive) return;
          longPressOpenedRef.current = false;
          const touch = event.touches[0];
          if (!touch) return;
          const clientX = touch.clientX;
          clearLongPress();
          longPressTimerRef.current = setTimeout(() => {
            longPressOpenedRef.current = true;
            onActivate(suggestion.id);
          }, 450);
          // Tentative caret; confirmed on touch end if not long-press.
          placeCaret(clientX);
        }}
        onTouchEnd={() => {
          clearLongPress();
        }}
        onTouchMove={() => {
          clearLongPress();
        }}
        onTouchCancel={() => {
          clearLongPress();
        }}
        aria-expanded={active}
        aria-controls={active ? panelId : undefined}
        aria-label={
          interactive
            ? `${label} note. Click to edit, double-click to open note.`
            : undefined
        }
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(event) => {
          if (!interactive) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onActivate(active ? null : suggestion.id);
          }
        }}
      >
        {text}
      </mark>

      {showPreview && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-40 mt-1 w-max max-w-[min(18rem,70vw)] rounded-sm border border-paper-line/80 bg-[rgb(250,247,240)] px-2.5 py-1.5 shadow-md"
        >
          <span className="block text-[10px] font-medium uppercase tracking-wide text-pen">
            {label}
          </span>
          <span className="mt-0.5 block font-mono text-xs leading-snug text-ink-800">
            <span className="text-ink-600">{suggestion.original}</span>
            <span className="text-ink-500"> → </span>
            <span>{suggestion.suggestion}</span>
          </span>
          <span className="mt-1 block text-[10px] text-ink-500">
            Double-click to open
          </span>
        </span>
      )}

      {panel}
    </span>
  );
}
