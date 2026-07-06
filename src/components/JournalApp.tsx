"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  DEFAULT_ANALYSIS_PREFERENCES,
  formatFocusAreasSummary,
} from "@/lib/analysis-preferences";
import type {
  AnalysisPreferences,
  EntryBlock,
  EntryReviewResult,
  JournalEntryListItem,
  JournalParagraph,
} from "@/lib/types";
import {
  analyzeEntryReview,
  analyzeText,
  ApiError,
  deleteEntry,
  fetchEntry,
  fetchPreferences,
  listEntries,
  savePreferences,
  submitFeedback,
} from "@/lib/api";
import {
  canSaveEntry,
  createParagraph,
  formatTodayDisplay,
  getTextBlocks,
  hasAnalyzableContent,
  isTextBlock,
} from "@/lib/entry-utils";
import {
  getSaveStatusLabel,
  useAutoSaveEntry,
} from "@/hooks/useAutoSaveEntry";
import { createClient } from "@/lib/supabase/client";
import { CheckFocusSettings } from "./CheckFocusSettings";
import { EntryDrawer } from "./EntryDrawer";
import { FeedbackDrawer } from "./FeedbackDrawer";
import { FeedbackForm } from "./FeedbackForm";
import { ParagraphEditor } from "./ParagraphEditor";
import { TopActionsMenu } from "./TopActionsMenu";

function getEntryText(blocks: EntryBlock[]): string {
  return getTextBlocks(blocks)
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function countInlineNotes(blocks: EntryBlock[]): number {
  return getTextBlocks(blocks).reduce((total, p) => {
    if (!p.analysis) return total;
    return total + p.analysis.suggestions.length;
  }, 0);
}

export function JournalApp({ user }: { user: User }) {
  const [title, setTitle] = useState(() => formatTodayDisplay());
  const [blocks, setBlocks] = useState<EntryBlock[]>(() => [createParagraph()]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [analyzingParagraphId, setAnalyzingParagraphId] = useState<
    string | null
  >(null);
  const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftEntryId, setDraftEntryId] = useState(() => crypto.randomUUID());
  const [entriesStale, setEntriesStale] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [drawerMessage, setDrawerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [entryReview, setEntryReview] = useState<EntryReviewResult | null>(
    null
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [analysisPreferences, setAnalysisPreferences] =
    useState<AnalysisPreferences>(DEFAULT_ANALYSIS_PREFERENCES);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackFormError, setFeedbackFormError] = useState<string | null>(
    null
  );
  const [feedbackFormSuccess, setFeedbackFormSuccess] = useState<string | null>(
    null
  );
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  const entryId = selectedId ?? draftEntryId;

  const focusSummary = useMemo(
    () => formatFocusAreasSummary(analysisPreferences.focusAreas),
    [analysisPreferences.focusAreas]
  );

  const inlineNoteCount = useMemo(
    () => countInlineNotes(blocks),
    [blocks]
  );

  const resolvedActiveBlockId = activeBlockId ?? blocks[0]?.id ?? null;

  const { saveStatus, isDirty, saveNow, flush, markSaved } = useAutoSaveEntry({
    entryId,
    title,
    blocks,
    canSave: canSaveEntry(blocks),
    debounceMs: 10_000,
    onSaved: (saved) => {
      setSelectedId(saved.id);
      setEntriesStale(true);
    },
  });

  const saveStatusLabel = getSaveStatusLabel(saveStatus, isDirty);
  const isSaving = saveStatus === "saving";

  const refreshEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const nextEntries = await listEntries();
      setEntries(nextEntries);
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : "Failed to load saved entries.";
      setMessage({ type: "error", text });
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextEntries = await listEntries();
        if (!cancelled) {
          setEntries(nextEntries);
        }
      } catch (error) {
        if (!cancelled) {
          const text =
            error instanceof ApiError
              ? error.message
              : "Failed to load saved entries.";
          setMessage({ type: "error", text });
        }
      } finally {
        if (!cancelled) {
          setEntriesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const preferences = await fetchPreferences();
        if (!cancelled) {
          setAnalysisPreferences(preferences);
        }
      } catch (error) {
        if (!cancelled) {
          const text =
            error instanceof ApiError
              ? error.message
              : "Failed to load check focus settings.";
          setMessage({ type: "error", text });
        }
      } finally {
        if (!cancelled) {
          setPreferencesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const drawerOpen =
      entriesOpen ||
      feedbackOpen ||
      preferencesOpen ||
      feedbackFormOpen ||
      actionsMenuOpen;
    document.body.classList.toggle("drawer-open", drawerOpen);
    return () => document.body.classList.remove("drawer-open");
  }, [entriesOpen, feedbackOpen, preferencesOpen, feedbackFormOpen, actionsMenuOpen]);

  useEffect(() => {
    if (!entriesOpen || !entriesStale) return;

    let cancelled = false;

    void listEntries()
      .then((nextEntries) => {
        if (!cancelled) {
          setEntries(nextEntries);
          setEntriesStale(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const text =
            error instanceof ApiError
              ? error.message
              : "Failed to load saved entries.";
          setMessage({ type: "error", text });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entriesOpen, entriesStale]);

  useEffect(() => {
    if (!entriesStale) return;

    const timer = setTimeout(() => {
      void listEntries()
        .then((nextEntries) => {
          setEntries(nextEntries);
          setEntriesStale(false);
        })
        .catch((error) => {
          const text =
            error instanceof ApiError
              ? error.message
              : "Failed to load saved entries.";
          setMessage({ type: "error", text });
        });
    }, 30_000);

    return () => clearTimeout(timer);
  }, [entriesStale]);

  const handleBlocksChange = (next: EntryBlock[]) => {
    setBlocks(next);
    setEntryReview(null);
  };

  const handleAnalyzeParagraph = async (paragraphId: string) => {
    const paragraph = blocks.find(
      (block): block is JournalParagraph =>
        block.id === paragraphId && isTextBlock(block)
    );
    if (!paragraph?.text.trim()) {
      setMessage({ type: "error", text: "Please write something first." });
      return;
    }

    setAnalyzingParagraphId(paragraphId);
    setActiveBlockId(paragraphId);
    setMessage(null);

    try {
      const { analysis, mock } = await analyzeText(
        paragraph.text.trim(),
        analysisPreferences
      );
      setMockMode(mock);

      setBlocks((prev) =>
        prev.map((block) =>
          block.type === "text" && block.id === paragraphId
            ? {
                ...block,
                analysis,
                analyzedText: paragraph.text.trim(),
              }
            : block
        )
      );
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : "Failed to analyze paragraph.";
      setMessage({ type: "error", text });
    } finally {
      setAnalyzingParagraphId(null);
    }
  };

  const handleRequestReview = async () => {
    const text = getEntryText(blocks);
    if (!text) {
      setMessage({ type: "error", text: "Write something before reviewing." });
      return;
    }

    setReviewLoading(true);
    setMessage(null);

    try {
      const { review, mock } = await analyzeEntryReview(
        text,
        analysisPreferences
      );
      setMockMode(mock);
      setEntryReview(review);
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : "Failed to review entry.";
      setMessage({ type: "error", text });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleOpenFeedback = () => {
    setFeedbackOpen(true);
    if (!entryReview && !reviewLoading && hasAnalyzableContent(blocks)) {
      handleRequestReview();
    }
  };

  const handleSavePreferences = async (next: AnalysisPreferences) => {
    setPreferencesSaving(true);
    setPreferencesError(null);

    try {
      const saved = await savePreferences(next);
      setAnalysisPreferences(saved);
      setPreferencesOpen(false);
      setMessage({ type: "success", text: "Check focus updated" });
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : "Failed to save check focus settings.";
      setPreferencesError(text);
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleSubmitFeedback = async (
    payload: Parameters<typeof submitFeedback>[0]
  ) => {
    setFeedbackSubmitting(true);
    setFeedbackFormError(null);

    try {
      await submitFeedback(payload);
      setFeedbackFormSuccess("Feedback sent — thank you!");
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : "Failed to send feedback.";
      setFeedbackFormError(text);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!canSaveEntry(blocks)) {
      setMessage({
        type: "error",
        text: "Write at least one paragraph before saving.",
      });
      return;
    }

    setMessage(null);

    const result = await saveNow();
    if (result.ok) {
      await refreshEntries();
      setEntriesStale(false);
      setMessage({ type: "success", text: "Saved" });
    } else if (result.error) {
      setMessage({ type: "error", text: result.error });
    }
  };

  const resetEditor = () => {
    const first = createParagraph();
    const newTitle = formatTodayDisplay();
    setTitle(newTitle);
    setBlocks([first]);
    setActiveBlockId(first.id);
    setSelectedId(null);
    setDraftEntryId(crypto.randomUUID());
    setMockMode(false);
    setEntryReview(null);
    markSaved(newTitle, [first]);
  };

  const handleNewEntry = async () => {
    await flush();
    resetEditor();
    setMessage(null);
    setDrawerMessage(null);
    setEntriesOpen(false);
  };

  const handleDeleteEntry = async (entry: JournalEntryListItem) => {
    setDrawerMessage(null);

    try {
      await deleteEntry(entry.id);

      if (selectedId === entry.id) {
        resetEditor();
      }

      await refreshEntries();
      setDrawerMessage({ type: "success", text: "Entry deleted" });
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : "Failed to delete entry.";
      setDrawerMessage({ type: "error", text });
    }
  };

  const handleSelectEntry = async (entry: JournalEntryListItem) => {
    const flushResult = await flush();
    if (!flushResult.ok && flushResult.error) {
      setMessage({ type: "error", text: flushResult.error });
      return;
    }

    try {
      const stored = await fetchEntry(entry.id);
      setSelectedId(stored.id);
      setTitle(stored.title);
      setBlocks(stored.blocks);
      setEntryReview(null);
      markSaved(stored.title, stored.blocks);

      const textBlocks = getTextBlocks(stored.blocks);
      const firstAnalyzed = textBlocks.find((p) => p.analysis);
      const activeId =
        firstAnalyzed?.id ?? textBlocks[0]?.id ?? stored.blocks[0]?.id ?? null;
      setActiveBlockId(activeId);
      setMessage(null);
      setMockMode(false);
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : "Failed to load entry.";
      setMessage({ type: "error", text });
    }
  };

  return (
    <div className="min-h-screen paper-texture">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <h1>English Journal</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setDrawerMessage(null);
              setEntriesOpen(true);
            }}
            className="feedback-btn alt"
            aria-label={`Entries, ${entries.length} saved`}
          >
            <span className="pen" aria-hidden>
              ▤
            </span>
            <span className="btn-label">Entries</span>
            <span className="n">{entries.length}</span>
          </button>
        </div>
        <TopActionsMenu
          onNewEntry={handleNewEntry}
          onSignOut={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
          }}
          onSendFeedback={() => {
            setFeedbackFormError(null);
            setFeedbackFormSuccess(null);
            setFeedbackFormOpen(true);
          }}
          onCheckFocus={() => {
            setPreferencesError(null);
            setPreferencesOpen(true);
          }}
          onOpenFeedback={handleOpenFeedback}
          inlineNoteCount={inlineNoteCount}
          onMenuOpenChange={setActionsMenuOpen}
        />
      </header>

      <main className="mx-auto max-w-sheet px-4 py-5 sm:px-6 sm:py-12">
        {mockMode && (
          <div className="mb-6 rounded border border-amber-200/80 bg-amber-50/80 px-4 py-2.5 font-sans text-xs text-amber-900">
            Demo mode — add{" "}
            <code className="rounded bg-amber-100/80 px-1">
              GOOGLE_GENERATIVE_AI_API_KEY
            </code>{" "}
            to <code className="rounded bg-amber-100/80 px-1">.env.local</code>{" "}
            for real feedback.
          </div>
        )}

        {message && (
          <div
            className={`mb-6 rounded px-4 py-2.5 font-sans text-sm ${
              message.type === "success"
                ? "bg-sage-100/60 text-sage-800"
                : "bg-coral-100/60 text-coral-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-5 sm:mb-8">
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={formatTodayDisplay()}
            className="w-full border-0 bg-transparent text-center font-display text-2xl font-semibold text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0 sm:text-[2rem]"
          />
          <div className="mt-2 flex justify-center sm:mt-3" aria-hidden>
            <span className="block h-0.5 w-10 rounded-full bg-pen sm:w-12" />
          </div>
        </div>

        <ParagraphEditor
          blocks={blocks}
          activeBlockId={resolvedActiveBlockId}
          analyzingParagraphId={analyzingParagraphId}
          userId={user.id}
          entryId={entryId}
          focusSummary={focusSummary}
          preferencesLoading={preferencesLoading}
          onBlocksChange={handleBlocksChange}
          onActiveBlockChange={setActiveBlockId}
          onAnalyzeParagraph={handleAnalyzeParagraph}
          onError={(text) => setMessage({ type: "error", text })}
        />

        <div className="mt-8 flex items-center justify-end gap-4 border-t border-paper-line/60 pt-6">
          {saveStatusLabel && (
            <span
              className="mr-auto font-sans text-sm text-ink-400"
              aria-live="polite"
            >
              {saveStatusLabel}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="feedback-btn"
            disabled={isSaving || !canSaveEntry(blocks)}
          >
            <span className="pen" aria-hidden>
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
                />
              </svg>
            </span>{" "}
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </main>

      <EntryDrawer
        open={entriesOpen}
        entries={entries}
        loading={entriesLoading}
        selectedId={selectedId}
        message={drawerMessage}
        onSelect={handleSelectEntry}
        onRefresh={refreshEntries}
        onClose={() => {
          setEntriesOpen(false);
          setDrawerMessage(null);
        }}
        onNewEntry={() => void handleNewEntry()}
        onDelete={handleDeleteEntry}
      />

      <FeedbackDrawer
        open={feedbackOpen}
        review={entryReview}
        loading={reviewLoading}
        focusSummary={focusSummary}
        onClose={() => setFeedbackOpen(false)}
        onRequestReview={handleRequestReview}
      />

      <CheckFocusSettings
        open={preferencesOpen}
        preferences={analysisPreferences}
        saving={preferencesSaving}
        error={preferencesError}
        onClose={() => {
          setPreferencesOpen(false);
          setPreferencesError(null);
        }}
        onSave={handleSavePreferences}
      />

      <FeedbackForm
        open={feedbackFormOpen}
        submitting={feedbackSubmitting}
        error={feedbackFormError}
        successMessage={feedbackFormSuccess}
        onClose={() => {
          setFeedbackFormOpen(false);
          setFeedbackFormError(null);
          setFeedbackFormSuccess(null);
        }}
        onSubmit={(payload) => void handleSubmitFeedback(payload)}
      />
    </div>
  );
}
