"use client";

import type { JournalEntry } from "@/lib/types";

interface EntryListProps {
  entries: JournalEntry[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (entry: JournalEntry) => void;
  onRefresh: () => void;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "No date";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EntryList({
  entries,
  loading,
  selectedId,
  onSelect,
  onRefresh,
}: EntryListProps) {
  return (
    <aside className="flex h-full flex-col rounded-2xl border border-ink-200/60 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
          Past entries
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-md px-2 py-1 text-xs font-medium text-sage-700 transition hover:bg-sage-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && entries.length === 0 ? (
          <p className="p-4 text-center text-sm text-ink-500">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="p-4 text-center text-sm leading-relaxed text-ink-500">
            No saved entries yet. Analyze and save your first journal entry to Notion.
          </p>
        ) : (
          <ul className="space-y-1">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    selectedId === entry.id
                      ? "bg-sage-50 ring-1 ring-sage-200"
                      : "hover:bg-ink-50"
                  }`}
                >
                  <p className="truncate text-sm font-medium text-ink-900">
                    {entry.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                    <span>{formatDate(entry.date)}</span>
                    {entry.grammarScore != null && (
                      <>
                        <span>·</span>
                        <span>{entry.grammarScore}/100</span>
                      </>
                    )}
                    {entry.tone && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{entry.tone}</span>
                      </>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
