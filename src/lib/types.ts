export type SuggestionCategory =
  | "grammar"
  | "tone"
  | "word-choice"
  | "naturalness"
  | "punctuation";

export interface Suggestion {
  category: SuggestionCategory;
  original: string;
  suggestion: string;
  explanation: string;
}

export interface AnalysisResult {
  correctedText: string;
  tone: "formal" | "casual" | "neutral" | "mixed";
  grammarScore: number;
  summary: string;
  suggestions: Suggestion[];
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  originalText: string;
  correctedText: string;
  tone: string;
  grammarScore: number | null;
  status: string;
  url?: string;
}

export interface SaveEntryPayload {
  title: string;
  originalText: string;
  analysis: AnalysisResult;
}
