"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { JournalParagraph } from "@/lib/types";
import { isParagraphStale } from "@/lib/entry-utils";
import {
  buildHighlightSegments,
  resolveSuggestionSpans,
  suggestionIdsOverlappingEdit,
} from "@/lib/suggestion-spans";
import {
  scrollSuggestionAnchor,
  suggestionNoteDomId,
} from "@/lib/suggestion-anchors";
import { MAX_SUGGESTION_DISCUSSION_MESSAGES } from "@/lib/suggestion-discussion";
import { DiscussionThread } from "./DiscussionThread";
import { Spinner } from "./Spinner";
import { SuggestionHighlight } from "./SuggestionHighlight";
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
  /** Incremented when Enter starts a new paragraph; collapse open notes. */
  notesCollapseNonce: number;
  onRemoveEmpty: (id: string) => void;
  onAskSuggestion: (
    paragraphId: string,
    suggestionId: string,
    question: string
  ) => Promise<void>;
  askingSuggestionId: string | null;
  onAskParagraph: (paragraphId: string, question: string) => Promise<void>;
  askingParagraphId: string | null;
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
  notesCollapseNonce,
  onRemoveEmpty,
  onAskSuggestion,
  askingSuggestionId,
  onAskParagraph,
  askingParagraphId,
}: ParagraphBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const askPopoverRef = useRef<HTMLDivElement>(null);
  const askButtonRef = useRef<HTMLButtonElement>(null);
  const askPanelId = useId();
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askPlacement, setAskPlacement] = useState<"below" | "above">("below");
  const [askMaxHeight, setAskMaxHeight] = useState<number | undefined>();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(
    null
  );
  /** After Edit on a note, taps on that mark place the caret instead of reopening it. */
  const [editCaretSuggestionId, setEditCaretSuggestionId] = useState<
    string | null
  >(null);
  const [pulseSuggestionId, setPulseSuggestionId] = useState<string | null>(
    null
  );
  const [pendingNoteScrollId, setPendingNoteScrollId] = useState<string | null>(
    null
  );
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState(
    () => new Set<string>()
  );
  const stale = isParagraphStale(paragraph);
  const hasNotes = Boolean(paragraph.analysis);
  const dimmed = isWriting && !isActive;
  const canCheck = Boolean(paragraph.text.trim());
  const noteCount = paragraph.analysis?.suggestions.length ?? 0;
  const notesLabel = `${noteCount} note${noteCount === 1 ? "" : "s"}`;
  const discussion = paragraph.discussion ?? [];
  const asking = askingParagraphId === paragraph.id;
  const atLimit = discussion.length + 2 > MAX_SUGGESTION_DISCUSSION_MESSAGES;
  const canAsk = !asking && !atLimit;

  const suggestions = paragraph.analysis?.suggestions ?? [];
  const analysisEpoch = `${paragraph.analyzedText ?? ""}:${suggestions
    .map((item) => item.id)
    .join(",")}`;
  const [seenAnalysisEpoch, setSeenAnalysisEpoch] = useState(analysisEpoch);
  if (analysisEpoch !== seenAnalysisEpoch) {
    setSeenAnalysisEpoch(analysisEpoch);
    setDismissedSuggestionIds(new Set());
    setActiveSuggestionId(null);
    setEditCaretSuggestionId(null);
    // Review finished after mount — open this paragraph's notes.
    // Initial load keeps notes collapsed (epoch matches on first render).
    if (paragraph.analysis) {
      setNotesExpanded(true);
    }
  }

  const suggestionById = useMemo(() => {
    const map = new Map(suggestions.map((item) => [item.id, item]));
    return map;
  }, [suggestions]);

  const highlightableSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) => !dismissedSuggestionIds.has(suggestion.id)
      ),
    [suggestions, dismissedSuggestionIds]
  );

  // Keep highlights that still match; drop only spans the user edited.
  const highlightSegments = useMemo(() => {
    if (!paragraph.analysis || highlightableSuggestions.length === 0) {
      return null;
    }
    const spans = resolveSuggestionSpans(
      paragraph.text,
      highlightableSuggestions
    );
    if (spans.length === 0) return null;
    return buildHighlightSegments(paragraph.text, spans);
  }, [paragraph.analysis, paragraph.text, highlightableSuggestions]);

  const mappedSuggestionIds = useMemo(() => {
    const ids = new Set<string>();
    if (!highlightSegments) return ids;
    for (const segment of highlightSegments) {
      if (segment.type === "mark") ids.add(segment.suggestionId);
    }
    return ids;
  }, [highlightSegments]);

  const effectiveActiveSuggestionId =
    activeSuggestionId && mappedSuggestionIds.has(activeSuggestionId)
      ? activeSuggestionId
      : null;
  const notesOpen = notesExpanded;
  const prevNotesCollapseNonce = useRef(notesCollapseNonce);

  useLayoutEffect(() => {
    if (notesCollapseNonce === prevNotesCollapseNonce.current) return;
    prevNotesCollapseNonce.current = notesCollapseNonce;
    setNotesExpanded(false);
    setActiveSuggestionId(null);
    setEditCaretSuggestionId(null);
    setAskOpen(false);
  }, [notesCollapseNonce]);

  const activateSuggestion = (suggestionId: string | null) => {
    if (suggestionId) {
      onSelect(paragraph.id);
      setEditCaretSuggestionId(null);
    }
    setActiveSuggestionId(suggestionId);
  };

  const revealSuggestionInText = (suggestionId: string) => {
    onSelect(paragraph.id);
    setActiveSuggestionId(suggestionId);
    setPulseSuggestionId(suggestionId);
    scrollSuggestionAnchor(suggestionId, "mark");
  };

  const revealSuggestionInNotes = (suggestionId: string) => {
    onSelect(paragraph.id);
    setNotesExpanded(true);
    setActiveSuggestionId(suggestionId);
    setPendingNoteScrollId(suggestionId);
  };

  useEffect(() => {
    if (!pulseSuggestionId) return;
    const timer = window.setTimeout(() => setPulseSuggestionId(null), 900);
    return () => window.clearTimeout(timer);
  }, [pulseSuggestionId]);

  useEffect(() => {
    if (!pendingNoteScrollId || !notesExpanded) return;
    scrollSuggestionAnchor(pendingNoteScrollId, "note");
    setPendingNoteScrollId(null);
  }, [pendingNoteScrollId, notesExpanded]);

  const handleTextChange = (next: string) => {
    const prev = paragraph.text;
    if (prev !== next && highlightableSuggestions.length > 0) {
      const spans = resolveSuggestionSpans(prev, highlightableSuggestions);
      const hitIds = suggestionIdsOverlappingEdit(prev, next, spans);
      if (hitIds.length > 0) {
        setDismissedSuggestionIds((current) => {
          const nextDismissed = new Set(current);
          for (const id of hitIds) nextDismissed.add(id);
          return nextDismissed;
        });
        if (activeSuggestionId && hitIds.includes(activeSuggestionId)) {
          setActiveSuggestionId(null);
        }
      }
    }
    onTextChange(paragraph.id, next);
  };

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [paragraph.text]);

  useEffect(() => {
    if (!askOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (askPopoverRef.current?.contains(target)) return;
      if (askButtonRef.current?.contains(target)) return;
      setAskOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAskOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [askOpen]);

  useEffect(() => {
    if (!askOpen) return;

    const GAP = 8;
    const MIN_COMFORTABLE = 200;
    const updatePlacement = () => {
      const button = askButtonRef.current;
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const spaceBelow = Math.max(0, window.innerHeight - buttonRect.bottom - GAP);
      const spaceAbove = Math.max(0, buttonRect.top - GAP);

      // Prefer below; flip above when the bottom is tight and the top has more room.
      const placement: "below" | "above" =
        spaceBelow < MIN_COMFORTABLE && spaceAbove > spaceBelow
          ? "above"
          : "below";

      const available = placement === "above" ? spaceAbove : spaceBelow;
      // Use nearly all free space on the chosen side (floor so short viewports still work).
      const maxHeight = Math.max(
        160,
        Math.min(available, window.innerHeight * 0.9)
      );

      setAskPlacement(placement);
      setAskMaxHeight(maxHeight);
    };

    updatePlacement();
    const frame = requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [askOpen, discussion.length]);

  const handleAsk = async () => {
    if (asking || atLimit) return;

    const question = draft.trim();
    if (!question) {
      setLocalError("Write a question first.");
      return;
    }

    setLocalError(null);
    try {
      await onAskParagraph(paragraph.id, question);
      setDraft("");
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to get a reply."
      );
    }
  };

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
      return;
    }

    if (
      e.key === "Backspace" &&
      e.currentTarget.selectionStart === 0 &&
      e.currentTarget.selectionEnd === 0 &&
      paragraph.text === ""
    ) {
      e.preventDefault();
      onRemoveEmpty(paragraph.id);
    }
  };

  const editorTextClass =
    "w-full resize-none overflow-hidden border-0 bg-transparent py-1 font-mono text-base leading-relaxed placeholder:text-ink-400 focus:outline-none focus:ring-0 sm:py-2 sm:text-lg sm:leading-[1.75]";

  return (
    <div
      className={`group relative transition-opacity duration-200 ${
        dimmed && !askOpen && !effectiveActiveSuggestionId ? "writing-dim" : ""
      } ${askOpen || effectiveActiveSuggestionId ? "z-30" : ""}`}
      onClick={() => onSelect(paragraph.id)}
    >
      <div className="notebook-margin relative">
        <textarea
          ref={textareaRef}
          value={paragraph.text}
          onChange={(e) => {
            handleTextChange(e.target.value);
          }}
          onFocus={() => onSelect(paragraph.id)}
          onBlur={() => {
            // Tapping a mark blurs the textarea before pointer handlers re-focus
            // it (common on long wrapped highlights). Defer clearing so Edit-caret
            // mode survives that race.
            window.setTimeout(() => {
              if (document.activeElement === textareaRef.current) return;
              setEditCaretSuggestionId(null);
            }, 0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            index === 0
              ? "Start writing… Enter for a new paragraph."
              : "Continue writing…"
          }
          rows={1}
          className={`${editorTextClass} relative z-0 ${
            highlightSegments
              ? "caret-ink-900 text-transparent selection:bg-pen/25 selection:text-transparent"
              : "text-ink-900"
          }`}
        />
        {highlightSegments && (
          <div
            aria-hidden={!effectiveActiveSuggestionId}
            className="pointer-events-none absolute inset-0 z-10 whitespace-pre-wrap break-words py-1 font-mono text-base leading-relaxed text-ink-900 sm:py-2 sm:text-lg sm:leading-[1.75]"
          >
            {highlightSegments.map((segment, segmentIndex) => {
              if (segment.type === "text") {
                return (
                  <span key={`t-${segmentIndex}`}>{segment.value}</span>
                );
              }

              const suggestion = suggestionById.get(segment.suggestionId);
              if (!suggestion) {
                return (
                  <span key={`m-${segment.suggestionId}-${segmentIndex}`}>
                    {segment.value}
                  </span>
                );
              }

              return (
                <SuggestionHighlight
                  key={`m-${segment.suggestionId}`}
                  suggestion={suggestion}
                  text={segment.value}
                  startOffset={segment.start}
                  interactive
                  active={effectiveActiveSuggestionId === suggestion.id}
                  pulsing={pulseSuggestionId === suggestion.id}
                  onActivate={activateSuggestion}
                  onRevealInNotes={() => revealSuggestionInNotes(suggestion.id)}
                  onPlaceCaret={(offset) => {
                    const el = textareaRef.current;
                    if (!el) return;
                    el.focus();
                    el.setSelectionRange(offset, offset);
                    onSelect(paragraph.id);
                  }}
                  preferCaretWhileEditing={
                    editCaretSuggestionId === suggestion.id
                  }
                  onStartEdit={() => setEditCaretSuggestionId(suggestion.id)}
                  asking={askingSuggestionId === suggestion.id}
                  onAsk={(question) =>
                    onAskSuggestion(paragraph.id, suggestion.id, question)
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {canCheck && (
        <div className="mt-0.5 sm:mt-1">
          <div className="flex items-center gap-2">
            {stale && !isAnalyzing && (
              <span className="text-[11px] text-pen/70">edited</span>
            )}
            <div className="relative ml-auto flex items-center gap-2">
              <button
                ref={askButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAskOpen((open) => !open);
                }}
                aria-expanded={askOpen}
                aria-controls={askPanelId}
                className="feedback-btn px-3 py-1 text-xs sm:px-3 sm:py-1.5"
              >
                <svg
                  className="pen h-3.5 w-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.17 48.17 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                </svg>
                Ask questions
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyze(paragraph.id);
                }}
                disabled={isAnalyzing}
                aria-busy={isAnalyzing}
                className="feedback-btn px-3 py-1 text-xs sm:px-3 sm:py-1.5"
              >
                {isAnalyzing ? (
                  <Spinner size="sm" />
                ) : (
                  <span className="pen" aria-hidden>
                    ✓
                  </span>
                )}
                {isAnalyzing ? "Reviewing" : "Review"}
              </button>

              {askOpen && (
                <div
                  ref={askPopoverRef}
                  id={askPanelId}
                  role="dialog"
                  aria-label="Ask questions about this paragraph"
                  className={`absolute right-0 z-20 flex w-[min(calc(100vw-2rem),24rem)] flex-col overflow-hidden rounded-sm border border-paper-line/80 bg-[rgb(250,247,240)] p-3 shadow-md ${
                    askPlacement === "above"
                      ? "bottom-full mb-2"
                      : "top-full mt-2"
                  }`}
                  style={
                    askMaxHeight != null
                      ? { maxHeight: askMaxHeight }
                      : { maxHeight: "min(28rem, 70vh)" }
                  }
                  onClick={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                >
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
                    label="Ask questions about this paragraph"
                    placeholder="How can I make this clearer? Is the tone right?"
                    atLimitMessage={`This conversation reached the ${MAX_SUGGESTION_DISCUSSION_MESSAGES}-message limit.`}
                    submitLabel="Send"
                    submittingLabel="Sending…"
                    collapsibleMessages
                    compactComposer
                    className="flex min-h-0 flex-1 flex-col gap-2"
                    messagesClassName="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain"
                  />
                </div>
              )}
            </div>
          </div>
          {isActive && !preferencesLoading && (
            <p className="mt-1 text-right font-sans text-xs text-ink-500">
              Review focus: {focusSummary}
            </p>
          )}
        </div>
      )}

      {hasNotes && paragraph.analysis && (
        <div className="mt-1 border-l-2 border-pen/30 pl-3 sm:pl-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNotesExpanded((v) => {
                const next = !v;
                if (next) onSelect(paragraph.id);
                return next;
              });
            }}
            className="flex items-center gap-1.5 py-1 text-[11px] font-medium uppercase tracking-wide text-pen sm:py-0"
            aria-expanded={notesOpen}
          >
            <svg
              className={`h-3 w-3 transition-transform ${
                notesOpen ? "rotate-90" : ""
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

          {notesOpen && (
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
              {paragraph.analysis.suggestions.map((suggestion) => (
                <SuggestionRow
                  key={suggestion.id}
                  suggestion={suggestion}
                  anchorId={suggestionNoteDomId(suggestion.id)}
                  anchored={effectiveActiveSuggestionId === suggestion.id}
                  forceExpanded={
                    effectiveActiveSuggestionId === suggestion.id
                  }
                  onRevealInText={
                    mappedSuggestionIds.has(suggestion.id)
                      ? () => revealSuggestionInText(suggestion.id)
                      : undefined
                  }
                  asking={askingSuggestionId === suggestion.id}
                  onAsk={(question) =>
                    onAskSuggestion(paragraph.id, suggestion.id, question)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
