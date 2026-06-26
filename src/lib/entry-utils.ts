import type {
  JournalEntryListItem,
  JournalParagraph,
  StoredJournalEntry,
} from "./types";

export function createParagraph(text = ""): JournalParagraph {
  return {
    id: crypto.randomUUID(),
    text,
    analysis: null,
    analyzedText: null,
  };
}

export function isParagraphStale(paragraph: JournalParagraph): boolean {
  if (!paragraph.analysis || !paragraph.analyzedText) return false;
  return paragraph.text.trim() !== paragraph.analyzedText;
}

export function getAnalyzedParagraphs(
  paragraphs: JournalParagraph[]
): JournalParagraph[] {
  return paragraphs.filter((p) => p.analysis !== null);
}

export function getAverageGrammarScore(
  paragraphs: JournalParagraph[]
): number | null {
  const analyzed = getAnalyzedParagraphs(paragraphs);
  if (analyzed.length === 0) return null;
  const total = analyzed.reduce(
    (sum, p) => sum + (p.analysis?.grammarScore ?? 0),
    0
  );
  return Math.round(total / analyzed.length);
}

export function getLatestTone(paragraphs: JournalParagraph[]): string {
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const tone = paragraphs[i].analysis?.tone;
    if (tone) return tone;
  }
  return "";
}

export function toListItem(entry: StoredJournalEntry): JournalEntryListItem {
  return {
    id: entry.id,
    title: entry.title,
    date: entry.date,
    grammarScore: getAverageGrammarScore(entry.paragraphs),
    tone: getLatestTone(entry.paragraphs),
    paragraphCount: entry.paragraphs.length,
    status: entry.status,
  };
}

export function getTotalWordCount(paragraphs: JournalParagraph[]): number {
  return paragraphs.reduce((total, p) => {
    const words = p.text.trim() ? p.text.trim().split(/\s+/).length : 0;
    return total + words;
  }, 0);
}

export function hasAnalyzableContent(paragraphs: JournalParagraph[]): boolean {
  return paragraphs.some((p) => p.text.trim().length > 0);
}

export function canSaveEntry(paragraphs: JournalParagraph[]): boolean {
  return hasAnalyzableContent(paragraphs);
}

export function formatTodayDisplay(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
