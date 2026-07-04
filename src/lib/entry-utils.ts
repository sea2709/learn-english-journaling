import type {
  EntryBlock,
  JournalEntryListItem,
  JournalImageBlock,
  JournalParagraph,
  StoredJournalEntry,
} from "./types";

export function createParagraph(text = ""): JournalParagraph {
  return {
    type: "text",
    id: crypto.randomUUID(),
    text,
    analysis: null,
    analyzedText: null,
  };
}

export function createImageBlock(path: string): JournalImageBlock {
  return {
    type: "image",
    id: crypto.randomUUID(),
    path,
  };
}

export function isTextBlock(block: EntryBlock): block is JournalParagraph {
  return block.type === "text";
}

export function isImageBlock(block: EntryBlock): block is JournalImageBlock {
  return block.type === "image";
}

export function getTextBlocks(blocks: EntryBlock[]): JournalParagraph[] {
  return blocks.filter(isTextBlock);
}

export function getImageBlocks(blocks: EntryBlock[]): JournalImageBlock[] {
  return blocks.filter(isImageBlock);
}

export function isParagraphStale(paragraph: JournalParagraph): boolean {
  if (!paragraph.analysis || !paragraph.analyzedText) return false;
  return paragraph.text.trim() !== paragraph.analyzedText;
}

export function getAnalyzedParagraphs(
  blocks: EntryBlock[]
): JournalParagraph[] {
  return getTextBlocks(blocks).filter((p) => p.analysis !== null);
}

export function getAverageGrammarScore(
  blocks: EntryBlock[]
): number | null {
  const analyzed = getAnalyzedParagraphs(blocks);
  if (analyzed.length === 0) return null;
  const total = analyzed.reduce(
    (sum, p) => sum + (p.analysis?.grammarScore ?? 0),
    0
  );
  return Math.round(total / analyzed.length);
}

export function getLatestTone(blocks: EntryBlock[]): string {
  const textBlocks = getTextBlocks(blocks);
  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const tone = textBlocks[i].analysis?.tone;
    if (tone) return tone;
  }
  return "";
}

export function toListItem(entry: StoredJournalEntry): JournalEntryListItem {
  const textBlocks = getTextBlocks(entry.blocks);
  return {
    id: entry.id,
    title: entry.title,
    date: entry.date,
    grammarScore: getAverageGrammarScore(entry.blocks),
    tone: getLatestTone(entry.blocks),
    paragraphCount: textBlocks.length,
    status: entry.status,
  };
}

export function getTotalWordCount(blocks: EntryBlock[]): number {
  return getTextBlocks(blocks).reduce((total, p) => {
    const words = p.text.trim() ? p.text.trim().split(/\s+/).length : 0;
    return total + words;
  }, 0);
}

export function hasAnalyzableContent(blocks: EntryBlock[]): boolean {
  return getTextBlocks(blocks).some((p) => p.text.trim().length > 0);
}

export function canSaveEntry(blocks: EntryBlock[]): boolean {
  return hasAnalyzableContent(blocks);
}

export function formatTodayDisplay(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
