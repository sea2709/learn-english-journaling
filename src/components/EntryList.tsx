"use client";

import type { JournalEntryListItem } from "@/lib/types";

interface EntryListProps {
  entries: JournalEntryListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (entry: JournalEntryListItem) => void;
  onRefresh: () => void;
  onHide: () => void;
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
  onHide,
}: EntryListProps) {
  return (
    <aside className="flex h-full flex-col rounded-2xl border border-ink-200/60 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
          Past entries
          {entries.length > 0 && (
            <span className="ml-1.5 font-normal normal-case text-ink-400">
              ({entries.length})
            </span>
          )}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-md px-2 py-1 text-xs font-medium text-sage-700 transition hover:bg-sage-50 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onHide}
            className="rounded-md p-1.5 text-ink-500 transition hover:bg-ink-50 hover:text-ink-700"
            aria-label="Hide past entries"
            title="Hide past entries"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && entries.length === 0 ? (
          <p className="p-4 text-center text-sm text-ink-500">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="p-4 text-center text-sm leading-relaxed text-ink-500">
            No saved entries yet. Check a paragraph and save your first journal entry.
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
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500">
                    <span>{formatDate(entry.date)}</span>
                    <span>·</span>
                    <span>
                      {entry.paragraphCount}{" "}
                      {entry.paragraphCount === 1 ? "paragraph" : "paragraphs"}
                    </span>
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
