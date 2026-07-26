import type { Suggestion } from "./types";

export interface SuggestionSpan {
  suggestionId: string;
  start: number;
  end: number;
}

/**
 * Map suggestions to non-overlapping character spans in `text` by exact
 * substring match of `original`. First suggestion wins on overlap; skips
 * when `original` is empty or not found.
 */
export function resolveSuggestionSpans(
  text: string,
  suggestions: Suggestion[]
): SuggestionSpan[] {
  const spans: SuggestionSpan[] = [];

  for (const suggestion of suggestions) {
    const needle = suggestion.original.trim();
    if (!needle) continue;

    let from = 0;
    let matchStart = -1;

    while (from <= text.length - needle.length) {
      const index = text.indexOf(needle, from);
      if (index === -1) break;

      const matchEnd = index + needle.length;
      const overlaps = spans.some(
        (span) => index < span.end && matchEnd > span.start
      );
      if (!overlaps) {
        matchStart = index;
        spans.push({
          suggestionId: suggestion.id,
          start: index,
          end: matchEnd,
        });
        break;
      }

      from = index + 1;
    }

    if (matchStart === -1) {
      // Unmappable — leave list-only.
      continue;
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}

/** Shared prefix/suffix diff between two strings. */
export function findEditRange(
  prev: string,
  next: string
): { start: number; prevEnd: number; nextEnd: number } {
  let start = 0;
  const minLen = Math.min(prev.length, next.length);
  while (start < minLen && prev[start] === next[start]) start += 1;

  let prevEnd = prev.length;
  let nextEnd = next.length;
  while (
    prevEnd > start &&
    nextEnd > start &&
    prev[prevEnd - 1] === next[nextEnd - 1]
  ) {
    prevEnd -= 1;
    nextEnd -= 1;
  }

  return { start, prevEnd, nextEnd };
}

/**
 * Suggestion ids whose spans overlapped the edit in `prevText`.
 * Pure insertions only invalidate a span when the caret is strictly inside it
 * (not on either edge), so typing after a highlight leaves it alone.
 */
export function suggestionIdsOverlappingEdit(
  prevText: string,
  nextText: string,
  spans: SuggestionSpan[]
): string[] {
  if (prevText === nextText || spans.length === 0) return [];

  const { start, prevEnd } = findEditRange(prevText, nextText);

  return spans
    .filter((span) => {
      if (prevEnd === start) {
        return span.start < start && start < span.end;
      }
      return span.start < prevEnd && span.end > start;
    })
    .map((span) => span.suggestionId);
}

export type HighlightSegment =
  | { type: "text"; value: string }
  | { type: "mark"; value: string; suggestionId: string; start: number };

/** Split `text` into plain and marked segments for overlay rendering. */
export function buildHighlightSegments(
  text: string,
  spans: SuggestionSpan[]
): HighlightSegment[] {
  if (spans.length === 0) {
    return text ? [{ type: "text", value: text }] : [];
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const span of spans) {
    if (span.start > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, span.start) });
    }
    segments.push({
      type: "mark",
      value: text.slice(span.start, span.end),
      suggestionId: span.suggestionId,
      start: span.start,
    });
    cursor = span.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments;
}
