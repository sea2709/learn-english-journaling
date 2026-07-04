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

/** Full-entry review from POST /api/analyze/review */
export type EntryReviewResult = AnalysisResult;

export interface JournalParagraph {
  type: "text";
  id: string;
  text: string;
  analysis: AnalysisResult | null;
  analyzedText: string | null;
}

export interface JournalImageBlock {
  type: "image";
  id: string;
  path: string;
}

export type EntryBlock = JournalParagraph | JournalImageBlock;

export interface StoredJournalEntry {
  id: string;
  title: string;
  date: string;
  blocks: EntryBlock[];
  status: string;
}

export interface JournalEntryListItem {
  id: string;
  title: string;
  date: string;
  grammarScore: number | null;
  tone: string;
  paragraphCount: number;
  status: string;
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

export interface AdminStats {
  totalUsers: number;
  signupsToday: number;
  signupsLast3Days: number;
  signupsLast7Days: number;
  signupsLast30Days: number;
  activeToday: number;
  activeLast3Days: number;
  activeLast7Days: number;
  activeLast30Days: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  providers: string[];
  createdAt: string;
  lastSignInAt: string | null;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  perPage: number;
}

export type AdminUserSort = "created_at" | "last_sign_in_at" | "email";
export type AdminUserSortOrder = "asc" | "desc";
