export type SuggestionCategory =
  | "grammar"
  | "spelling"
  | "tone"
  | "word-choice"
  | "naturalness"
  | "punctuation";

export type AnalysisFocusArea = SuggestionCategory;

export interface AnalysisPreferences {
  focusAreas: AnalysisFocusArea[];
  customNote?: string;
}

export interface SuggestionMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Suggestion {
  /** Assigned by the app after analysis; not produced by the model. */
  id: string;
  category: SuggestionCategory;
  original: string;
  suggestion: string;
  explanation: string;
  /** Per-suggestion follow-up chat; cleared when the paragraph is re-Checked. */
  discussion?: SuggestionMessage[];
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

export type FeedbackCategory = "bug" | "idea" | "other";
export type FeedbackStatus = "new" | "read" | "archived";

export interface UserFeedbackSubmission {
  category: FeedbackCategory;
  message: string;
  contactNote?: string;
}

export interface AdminFeedbackRow {
  id: string;
  userId: string;
  userEmail: string;
  category: FeedbackCategory;
  message: string;
  contactNote: string | null;
  status: FeedbackStatus;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeedbackResponse {
  feedback: AdminFeedbackRow[];
  total: number;
  page: number;
  perPage: number;
  newCount: number;
}

export type AdminFeedbackSort = "created_at" | "status" | "category";
export type AdminFeedbackSortOrder = "asc" | "desc";
