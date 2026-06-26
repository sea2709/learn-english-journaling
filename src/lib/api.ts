import type {
  AnalysisResult,
  EntryReviewResult,
  JournalEntryListItem,
  StoredJournalEntry,
} from "./types";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Request failed."
    );
  }

  return data as T;
}

export async function analyzeText(
  text: string
): Promise<{ analysis: AnalysisResult; mock: boolean }> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return parseResponse(response);
}

export async function analyzeEntryReview(
  text: string
): Promise<{ review: EntryReviewResult; mock: boolean }> {
  const response = await fetch("/api/analyze/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return parseResponse(response);
}

export async function listEntries(): Promise<JournalEntryListItem[]> {
  const response = await fetch("/api/entries");
  const data = await parseResponse<{ entries: JournalEntryListItem[] }>(
    response
  );
  return data.entries;
}

export async function fetchEntry(id: string): Promise<StoredJournalEntry> {
  const response = await fetch(`/api/entries/${id}`);
  const data = await parseResponse<{ entry: StoredJournalEntry }>(response);
  return data.entry;
}

export async function saveEntry(
  entry: StoredJournalEntry
): Promise<StoredJournalEntry> {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  const data = await parseResponse<{ entry: StoredJournalEntry }>(response);
  return data.entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const response = await fetch(`/api/entries/${id}`, {
    method: "DELETE",
  });

  await parseResponse(response);
}
