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

export interface EntryMonthGroup {
  key: string;
  label: string;
  entries: JournalEntryListItem[];
}

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

function monthKeyFromDate(dateStr: string): string {
  if (!dateStr) return "unknown";
  const key = dateStr.slice(0, 7);
  return MONTH_KEY_RE.test(key) ? key : "unknown";
}

function formatMonthLabel(key: string): string {
  if (key === "unknown") return "No date";
  const date = new Date(`${key}-01T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Group entries by calendar month of `entry.date`, newest months first. */
export function groupEntriesByMonth(
  entries: JournalEntryListItem[]
): EntryMonthGroup[] {
  const groups = new Map<string, JournalEntryListItem[]>();

  for (const entry of entries) {
    const key = monthKeyFromDate(entry.date);
    const list = groups.get(key);
    if (list) list.push(entry);
    else groups.set(key, [entry]);
  }

  return [...groups.entries()]
    .map(([key, monthEntries]) => ({
      key,
      label: formatMonthLabel(key),
      entries: [...monthEntries].sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
      ),
    }))
    .sort((a, b) => {
      if (a.key === "unknown") return 1;
      if (b.key === "unknown") return -1;
      return b.key.localeCompare(a.key);
    });
}
