import type {
  AnalysisPreferences,
  AnalysisResult,
  AdminStats,
  AdminUserSort,
  AdminUsersResponse,
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
  text: string,
  preferences?: AnalysisPreferences
): Promise<{ analysis: AnalysisResult; mock: boolean }> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, preferences }),
  });

  return parseResponse(response);
}

export async function analyzeEntryReview(
  text: string,
  preferences?: AnalysisPreferences
): Promise<{ review: EntryReviewResult; mock: boolean }> {
  const response = await fetch("/api/analyze/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, preferences }),
  });

  return parseResponse(response);
}

export async function fetchPreferences(): Promise<AnalysisPreferences> {
  const response = await fetch("/api/preferences");
  const data = await parseResponse<{ preferences: AnalysisPreferences }>(
    response
  );
  return data.preferences;
}

export async function savePreferences(
  preferences: AnalysisPreferences
): Promise<AnalysisPreferences> {
  const response = await fetch("/api/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
  const data = await parseResponse<{ preferences: AnalysisPreferences }>(
    response
  );
  return data.preferences;
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

export async function fetchAdminStats(): Promise<AdminStats> {
  const response = await fetch("/api/admin/stats");
  const data = await parseResponse<{ stats: AdminStats }>(response);
  return data.stats;
}

export async function fetchAdminUsers(options: {
  page?: number;
  perPage?: number;
  sort?: AdminUserSort;
  order?: "asc" | "desc";
}): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();

  if (options.page) params.set("page", String(options.page));
  if (options.perPage) params.set("perPage", String(options.perPage));
  if (options.sort) params.set("sort", options.sort);
  if (options.order) params.set("order", options.order);

  const query = params.toString();
  const response = await fetch(
    `/api/admin/users${query ? `?${query}` : ""}`
  );

  return parseResponse<AdminUsersResponse>(response);
}
