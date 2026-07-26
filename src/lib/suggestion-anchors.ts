/** Stable DOM ids for linking in-text highlights and notes list rows. */
export function suggestionMarkDomId(suggestionId: string): string {
  return `suggestion-mark-${suggestionId}`;
}

export function suggestionNoteDomId(suggestionId: string): string {
  return `suggestion-note-${suggestionId}`;
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
