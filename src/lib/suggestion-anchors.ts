/** Stable DOM ids for linking in-text highlights and notes list rows. */
export function suggestionMarkDomId(suggestionId: string): string {
  return `suggestion-mark-${suggestionId}`;
}

export function suggestionNoteDomId(suggestionId: string): string {
  return `suggestion-note-${suggestionId}`;
}

const MARK_ID_PREFIX = "suggestion-mark-";

/** Resolve a suggestion id from a mark element (data attr or DOM id). */
export function suggestionIdFromMarkElement(el: Element): string | null {
  const mark = el.classList.contains("suggestion-mark")
    ? el
    : el.closest(".suggestion-mark");
  if (!mark) return null;

  const dataId = mark.getAttribute("data-suggestion-id");
  if (dataId) return dataId;

  const domId = mark.id;
  if (domId.startsWith(MARK_ID_PREFIX)) {
    return domId.slice(MARK_ID_PREFIX.length);
  }
  return null;
}

/**
 * Find a suggestion mark under the viewport point (e.g. beneath the sheet
 * backdrop) so a single tap can switch notes on mobile.
 */
export function suggestionIdFromPoint(
  clientX: number,
  clientY: number
): string | null {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    if (!(el instanceof Element)) continue;
    if (el.classList.contains("suggestion-note-backdrop")) continue;
    const id = suggestionIdFromMarkElement(el);
    if (id) return id;
  }
  return null;
}

export function scrollSuggestionAnchor(
  suggestionId: string,
  target: "mark" | "note"
): void {
  const id =
    target === "mark"
      ? suggestionMarkDomId(suggestionId)
      : suggestionNoteDomId(suggestionId);

  const tryScroll = (attemptsLeft: number) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (attemptsLeft <= 0) return;
    requestAnimationFrame(() => tryScroll(attemptsLeft - 1));
  };

  // Wait for notes expand / row mount before scrolling.
  requestAnimationFrame(() => tryScroll(8));
}
