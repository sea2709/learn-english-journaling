"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { MAX_SUGGESTION_DISCUSSION_MESSAGES } from "@/lib/suggestion-discussion";
import type { Suggestion, SuggestionCategory } from "@/lib/types";
import { DiscussionThread } from "./DiscussionThread";
import { characterOffsetFromPoint } from "@/lib/caret-from-point";
import { suggestionMarkDomId } from "@/lib/suggestion-anchors";

const categoryLabels: Record<SuggestionCategory, string> = {
  grammar: "Grammar",
  spelling: "Spelling",
  tone: "Tone",
  "word-choice": "Word choice",
  naturalness: "Naturalness",
  punctuation: "Punctuation",
};

const TAP_MOVE_THRESHOLD_PX = 24;
const TAP_MAX_DURATION_MS = 550;
/** Blur→pointerdown race window after tapping a mark while editing. */
const EDIT_BLUR_RACE_MS = 100;
const ANCHOR_STALE_DISTANCE_PX = 48;

interface AnchorPoint {
  x: number;
  y: number;
}

const actionLinkClass =
  "shrink-0 font-sans text-xs text-ink-500 no-underline hover:text-pen hover:underline hover:decoration-pen/60 hover:underline-offset-2";

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
  /** Place the textarea caret for editing. */
  onPlaceCaret: (offset: number) => void;
  /**
   * After Edit on this suggestion: taps may place the caret while the editor is
   * focused (or in the blur race from tapping the mark).
   */
  preferCaretWhileEditing?: boolean;
  /** True when the paragraph textarea is focused. */
  isEditorFocused?: () => boolean;
  /** ms since the paragraph textarea last blurred (0 if unknown). */
  msSinceEditorBlur?: () => number;
  /** Called when the user chooses Edit in the note. */
  onStartEdit?: () => void;
  /** Jump to the matching note in the list below. */
  onRevealInNotes?: () => void;
  onAsk?: (question: string) => Promise<void>;
  asking?: boolean;
}

interface PanelCoords {
  sheet: boolean;
  top?: number;
  bottom?: number;
  left: number;
  maxHeight: number;
}

function shouldTapToOpenNote(pointerType: string): boolean {
  if (pointerType === "touch") return true;
  if (pointerType === "pen") return false;
  return (
    pointerType === "mouse" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

function prefersSheetLayout(): boolean {
  return window.matchMedia("(max-width: 639px), (pointer: coarse)").matches;
}

function distanceToRect(x: number, y: number, rect: DOMRect): number {
  const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
  const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
  return Math.hypot(dx, dy);
}

/** Line box nearest the click; wrapping marks span many rects. */
function lineRectNearPoint(
  element: Element,
  point: AnchorPoint | null
): DOMRect {
  const rects = Array.from(element.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0
  );
  if (rects.length === 0) return element.getBoundingClientRect();

  const visible =
    rects.find((rect) => rect.bottom > 0 && rect.top < window.innerHeight) ??
    rects[0];

  if (!point) return visible;

  const containing = rects.find(
    (rect) =>
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
  );
  if (containing) return containing;

  let best = rects[0];
  let bestDist = Infinity;
  for (const rect of rects) {
    const dist = distanceToRect(point.x, point.y, rect);
    if (dist < bestDist) {
      bestDist = dist;
      best = rect;
    }
  }

  return bestDist > ANCHOR_STALE_DISTANCE_PX ? visible : best;
}

function clampedLeft(preferred: number, panelWidth: number): number {
  return Math.max(
    8,
    Math.min(preferred, window.innerWidth - panelWidth - 8)
  );
}

const subscribeNoop = () => () => {};

export function SuggestionHighlight({
  suggestion,
  text,
  startOffset,
  interactive,
  active,
  pulsing = false,
  onActivate,
  onPlaceCaret,
  preferCaretWhileEditing = false,
  isEditorFocused,
  msSinceEditorBlur,
  onStartEdit,
  onRevealInNotes,
  onAsk,
  asking = false,
}: SuggestionHighlightProps) {
  const markRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [hovering, setHovering] = useState(false);
  const [previewCoords, setPreviewCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const touchOriginRef = useRef<{ x: number; y: number; at: number } | null>(
    null
  );
  const touchMovedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const placedCaretOnDownRef = useRef(false);
  const editOffsetRef = useRef(startOffset);
  const lastPointerTypeRef = useRef<string>("mouse");
  const anchorPointRef = useRef<AnchorPoint | null>(null);

  const label = categoryLabels[suggestion.category] ?? suggestion.category;
  const discussion = suggestion.discussion ?? [];
  const atLimit = discussion.length + 2 > MAX_SUGGESTION_DISCUSSION_MESSAGES;
  const canAsk = Boolean(onAsk) && !asking && !atLimit;
  const showPreview = interactive && hovering && !active;

  useEffect(() => {
    if (!active) {
      editOffsetRef.current = startOffset;
      anchorPointRef.current = null;
    }
  }, [active, startOffset]);

  useLayoutEffect(() => {
    if (!active) return;

    const GAP = 8;
    const PANEL_WIDTH = Math.min(320, window.innerWidth - 16);

    const updatePosition = () => {
      const mark = markRef.current;
      if (!mark) return;

      if (prefersSheetLayout()) {
        setCoords({
          sheet: true,
          left: 0,
          bottom: 0,
          maxHeight: Math.max(
            200,
            Math.min(window.innerHeight * 0.72, window.innerHeight - 16)
          ),
        });
        return;
      }

      const point = anchorPointRef.current;
      const rect = lineRectNearPoint(mark, point);
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - GAP);
      const spaceAbove = Math.max(0, rect.top - GAP);
      const placement =
        spaceBelow >= 220 || spaceBelow >= spaceAbove ? "below" : "above";
      const maxHeight = Math.max(
        160,
        placement === "below" ? spaceBelow : spaceAbove
      );

      const useClickX =
        point != null &&
        distanceToRect(point.x, point.y, rect) <= ANCHOR_STALE_DISTANCE_PX;
      const left = clampedLeft(useClickX ? point.x : rect.left, PANEL_WIDTH);

      setCoords({
        sheet: false,
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

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (markRef.current?.contains(target)) return;
      // Let another highlight's tap open its note; don't dismiss on pointerdown
      // or the close can race the other mark's activate on pointerup.
      if (
        target instanceof Element &&
        target.closest(".suggestion-mark")
      ) {
        return;
      }
      onActivate(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onActivate(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
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

  const caretOffsetFromPoint = (clientX: number, clientY: number) => {
    const mark = markRef.current;
    if (!mark || text.length === 0) return startOffset;
    return startOffset + characterOffsetFromPoint(mark, clientX, clientY);
  };

  const placeCaret = (clientX: number, clientY: number) => {
    onPlaceCaret(caretOffsetFromPoint(clientX, clientY));
  };

  const shouldPlaceCaretOnTap = () => {
    if (!preferCaretWhileEditing) return false;
    if (isEditorFocused?.()) return true;
    const sinceBlur = msSinceEditorBlur?.() ?? Number.POSITIVE_INFINITY;
    return sinceBlur < EDIT_BLUR_RACE_MS;
  };

  const releaseTapPointerCapture = (
    event: Pick<PointerEvent, "pointerId">
  ) => {
    const mark = markRef.current;
    if (!mark || !mark.hasPointerCapture(event.pointerId)) return;
    mark.releasePointerCapture(event.pointerId);
  };

  const updatePreviewFromPoint = (clientX: number, clientY: number) => {
    const mark = markRef.current;
    if (!mark) return;
    const point = { x: clientX, y: clientY };
    const rect = lineRectNearPoint(mark, point);
    const next = {
      top: rect.bottom + 4,
      left: clampedLeft(point.x, Math.min(288, window.innerWidth - 16)),
    };
    setPreviewCoords((prev) =>
      prev && prev.top === next.top && prev.left === next.left ? prev : next
    );
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    const offset = editOffsetRef.current;
    onStartEdit?.();
    onActivate(null);
    onPlaceCaret(offset);
  };

  const panel =
    active && coords && mounted
      ? createPortal(
          <>
            {coords.sheet && (
              <div
                className="fixed inset-0 z-[59] bg-ink-900/20"
                onPointerDown={(event) => {
                  event.preventDefault();
                  onActivate(null);
                }}
              />
            )}
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={`${label} note`}
              className={
                coords.sheet
                  ? "fixed inset-x-0 bottom-0 z-[60] flex w-full flex-col overflow-hidden rounded-t-md border border-paper-line/80 bg-[rgb(250,247,240)] p-4 shadow-md"
                  : "fixed z-[60] flex w-[min(calc(100vw-2rem),20rem)] flex-col overflow-hidden rounded-sm border border-paper-line/80 bg-[rgb(250,247,240)] p-3 shadow-md"
              }
              style={
                coords.sheet
                  ? { maxHeight: coords.maxHeight }
                  : {
                      left: coords.left,
                      top: coords.top,
                      bottom: coords.bottom,
                      maxHeight: coords.maxHeight,
                    }
              }
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onWheel={(event) => event.stopPropagation()}
            >
              {coords.sheet && (
                <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-paper-line" />
              )}
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-pen">
                  {label}
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    className={actionLinkClass}
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                  {onRevealInNotes && (
                    <button
                      type="button"
                      className={actionLinkClass}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRevealInNotes();
                      }}
                    >
                      View in notes
                    </button>
                  )}
                  {coords.sheet && (
                    <button
                      type="button"
                      className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-ink-500 hover:bg-paper-dark hover:text-ink-800 sm:min-h-0 sm:min-w-0"
                      aria-label="Close note"
                      onClick={(event) => {
                        event.stopPropagation();
                        onActivate(null);
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
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
                    composerRows={coords.sheet ? 3 : 4}
                    className="flex min-h-0 flex-col gap-2"
                    messagesClassName={
                      coords.sheet
                        ? "min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain"
                        : "max-h-40 space-y-2 overflow-y-auto overscroll-contain"
                    }
                  />
                </div>
              )}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <span className="relative inline">
      <mark
        ref={markRef}
        id={suggestionMarkDomId(suggestion.id)}
        className={`suggestion-mark pointer-events-auto scroll-mt-24 rounded-[1px] touch-manipulation ${
          interactive
            ? "cursor-text suggestion-mark--interactive"
            : "suggestion-mark--stale"
        } ${active ? "suggestion-mark--active" : ""} ${
          pulsing ? "suggestion-mark--pulse" : ""
        }`}
        title={
          interactive ? "Click to edit, double-click or tap for note" : undefined
        }
        onMouseEnter={(event) => {
          if (!interactive) return;
          if (!window.matchMedia("(hover: hover)").matches) return;
          setHovering(true);
          updatePreviewFromPoint(event.clientX, event.clientY);
        }}
        onMouseMove={(event) => {
          if (!interactive || !hovering) return;
          updatePreviewFromPoint(event.clientX, event.clientY);
        }}
        onMouseLeave={() => {
          setHovering(false);
          setPreviewCoords(null);
        }}
        onPointerDown={(event) => {
          if (!interactive || event.button !== 0) return;
          lastPointerTypeRef.current = event.pointerType;
          anchorPointRef.current = { x: event.clientX, y: event.clientY };
          editOffsetRef.current = caretOffsetFromPoint(
            event.clientX,
            event.clientY
          );
          placedCaretOnDownRef.current = false;
          if (shouldTapToOpenNote(event.pointerType)) {
            // After Edit: place caret while the editor is focused, or in the
            // blur race from tapping this mark (common on wrapped highlights).
            // If Edit-caret is stale (keyboard dismissed earlier), open the note.
            if (shouldPlaceCaretOnTap()) {
              event.preventDefault();
              event.stopPropagation();
              placedCaretOnDownRef.current = true;
              suppressClickRef.current = true;
              placeCaret(event.clientX, event.clientY);
              return;
            }
            touchOriginRef.current = {
              x: event.clientX,
              y: event.clientY,
              at: Date.now(),
            };
            touchMovedRef.current = false;
            try {
              markRef.current?.setPointerCapture(event.pointerId);
            } catch {
              // Some browsers throw if capture isn't allowed; tap may still work.
            }
            return;
          }
          if (event.detail >= 2) return;
          event.preventDefault();
          event.stopPropagation();
          placeCaret(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          const origin = touchOriginRef.current;
          if (!origin) return;
          if (
            Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >
            TAP_MOVE_THRESHOLD_PX
          ) {
            touchMovedRef.current = true;
          }
        }}
        onPointerUp={(event) => {
          if (!interactive || !shouldTapToOpenNote(event.pointerType)) return;
          releaseTapPointerCapture(event);
          if (placedCaretOnDownRef.current) {
            placedCaretOnDownRef.current = false;
            return;
          }
          const origin = touchOriginRef.current;
          touchOriginRef.current = null;
          if (!origin || touchMovedRef.current) return;
          if (Date.now() - origin.at > TAP_MAX_DURATION_MS) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = true;
          editOffsetRef.current = caretOffsetFromPoint(
            event.clientX,
            event.clientY
          );
          // Leave edit mode so the note sheet can take over (keyboard dismisses).
          const focused = document.activeElement;
          if (focused instanceof HTMLTextAreaElement) {
            focused.blur();
          }
          onActivate(active ? null : suggestion.id);
        }}
        onPointerCancel={(event) => {
          releaseTapPointerCapture(event);
          touchOriginRef.current = null;
          placedCaretOnDownRef.current = false;
        }}
        onClick={(event) => {
          if (!interactive) return;
          event.preventDefault();
          event.stopPropagation();
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
          }
        }}
        onDoubleClick={(event) => {
          if (!interactive) return;
          event.preventDefault();
          event.stopPropagation();
          if (shouldTapToOpenNote(lastPointerTypeRef.current)) {
            return;
          }
          anchorPointRef.current = { x: event.clientX, y: event.clientY };
          onActivate(active ? null : suggestion.id);
        }}
        aria-expanded={active}
        aria-controls={active ? panelId : undefined}
        aria-label={
          interactive
            ? `${label} note. Click to edit, double-click or tap to open note.`
            : undefined
        }
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? (preferCaretWhileEditing ? -1 : 0) : undefined}
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

      {showPreview &&
        previewCoords &&
        mounted &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-40 w-max max-w-[min(18rem,70vw)] rounded-sm border border-paper-line/80 bg-[rgb(250,247,240)] px-2.5 py-1.5 shadow-md"
            style={{ top: previewCoords.top, left: previewCoords.left }}
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
          </span>,
          document.body
        )}

      {panel}
    </span>
  );
}
