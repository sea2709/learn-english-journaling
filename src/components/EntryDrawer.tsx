"use client";

import { useEffect, useState } from "react";
import type { JournalEntryListItem } from "@/lib/types";
import { scoreToDisplay } from "./ScoreRing";

interface EntryDrawerProps {
  open: boolean;
  entries: JournalEntryListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (entry: JournalEntryListItem) => void;
  onRefresh: () => void;
  onClose: () => void;
  onNewEntry: () => void;
  onDelete: (entry: JournalEntryListItem) => void;
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

export function EntryDrawer({
  open,
  entries,
  loading,
  selectedId,
  onSelect,
  onRefresh,
  onClose,
  onNewEntry,
  onDelete,
}: EntryDrawerProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setConfirmDeleteId(null);
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in bg-ink-950/25"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed left-0 top-0 z-50 flex h-full w-80 max-w-[calc(100vw-2rem)] animate-drawer-in-left flex-col bg-paper shadow-xl max-[560px]:w-full"
        role="dialog"
        aria-label="Past entries"
      >
        <header className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Entries
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-ink-500 transition hover:bg-paper-dark hover:text-ink-800"
            aria-label="Close entries"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-paper-line px-5 py-3">
          <button
            type="button"
            onClick={onNewEntry}
            className="flex-1 rounded border border-paper-line bg-white/50 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-white"
          >
            New entry
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded px-3 py-2 text-sm text-ink-500 transition hover:bg-paper-dark hover:text-ink-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading && entries.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-500">
              Loading entries…
            </p>
          ) : entries.length === 0 ? (
            <p className="p-4 text-center text-sm leading-relaxed text-ink-500">
              No saved entries yet. Write and save your first journal entry.
            </p>
          ) : (
            <ul className="space-y-1">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <div
                    className={`group flex items-stretch gap-1 rounded-lg pr-1.5 transition ${
                      selectedId === entry.id
                        ? "bg-white/80 ring-1 ring-pen/20"
                        : "hover:bg-white/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(entry);
                        onClose();
                      }}
                      className="min-w-0 flex-1 rounded-lg px-3 py-3 text-left"
                    >
                      <p className="truncate font-display text-sm font-medium text-ink-900">
                        {entry.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-sans text-xs text-ink-500">
                        <span>{formatDate(entry.date)}</span>
                        <span>·</span>
                        <span>
                          {entry.paragraphCount}{" "}
                          {entry.paragraphCount === 1 ? "para" : "paras"}
                        </span>
                        {entry.grammarScore != null && (
                          <>
                            <span>·</span>
                            <span>{scoreToDisplay(entry.grammarScore)}/10</span>
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

                    {confirmDeleteId === entry.id ? (
                      <div className="flex shrink-0 items-center gap-1 self-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry);
                            setConfirmDeleteId(null);
                          }}
                          disabled={loading}
                          className="rounded px-2 py-1 font-sans text-xs font-medium text-coral-700 transition hover:bg-coral-100/60 disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="rounded px-2 py-1 font-sans text-xs text-ink-500 transition hover:bg-paper-dark hover:text-ink-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(entry.id);
                        }}
                        disabled={loading}
                        aria-label="Delete entry"
                        className="shrink-0 self-center rounded p-1.5 text-ink-400 transition hover:bg-coral-100/60 hover:text-coral-600 focus:opacity-100 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
