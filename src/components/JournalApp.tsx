"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type {
  EntryReviewResult,
  JournalEntryListItem,
  JournalParagraph,
  StoredJournalEntry,
} from "@/lib/types";
import {
  analyzeEntryReview,
  analyzeText,
  ApiError,
  deleteEntry,
  fetchEntry,
  listEntries,
  saveEntry as saveEntryApi,
} from "@/lib/api";
import {
  canSaveEntry,
  createParagraph,
  formatTodayDisplay,
  getTotalWordCount,
  hasAnalyzableContent,
} from "@/lib/entry-utils";
import { createClient } from "@/lib/supabase/client";
import { EntryDrawer } from "./EntryDrawer";
import { FeedbackDrawer } from "./FeedbackDrawer";
import { ParagraphEditor } from "./ParagraphEditor";

function getEntryText(paragraphs: JournalParagraph[]): string {
  return paragraphs
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function countInlineNotes(paragraphs: JournalParagraph[]): number {
  return paragraphs.reduce((total, p) => {
    if (!p.analysis) return total;
    return total + p.analysis.suggestions.length;
  }, 0);
}

export function JournalApp({ user }: { user: User }) {
  const [title, setTitle] = useState(() => formatTodayDisplay());
  const [paragraphs, setParagraphs] = useState<JournalParagraph[]>([
    createParagraph(),
  ]);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    null
  );
  const [analyzingParagraphId, setAnalyzingParagraphId] = useState<
    string | null
  >(null);
  const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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

  const inlineNoteCount = useMemo(
    () => countInlineNotes(paragraphs),
    [paragraphs]
  );
  const wordCount = getTotalWordCount(paragraphs);

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
    refreshEntries();
    setActiveParagraphId((prev) => prev ?? paragraphs[0]?.id ?? null);
  }, [refreshEntries]);

  useEffect(() => {
    const drawerOpen = entriesOpen || feedbackOpen;
    document.body.classList.toggle("drawer-open", drawerOpen);
    return () => document.body.classList.remove("drawer-open");
  }, [entriesOpen, feedbackOpen]);

  const handleParagraphsChange = (next: JournalParagraph[]) => {
    setParagraphs(next);
    setEntryReview(null);
  };

  const handleAnalyzeParagraph = async (paragraphId: string) => {
    const paragraph = paragraphs.find((p) => p.id === paragraphId);
    if (!paragraph?.text.trim()) {
      setMessage({ type: "error", text: "Please write something first." });
      return;
    }

    setAnalyzingParagraphId(paragraphId);
    setActiveParagraphId(paragraphId);
    setMessage(null);

    try {
      const { analysis, mock } = await analyzeText(paragraph.text.trim());
      setMockMode(mock);

      setParagraphs((prev) =>
        prev.map((p) =>
          p.id === paragraphId
            ? {
                ...p,
                analysis,
                analyzedText: paragraph.text.trim(),
              }
            : p
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
    const text = getEntryText(paragraphs);
    if (!text) {
      setMessage({ type: "error", text: "Write something before reviewing." });
      return;
    }

    setReviewLoading(true);
    setMessage(null);

    try {
      const { review, mock } = await analyzeEntryReview(text);
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
    if (!entryReview && !reviewLoading && hasAnalyzableContent(paragraphs)) {
      handleRequestReview();
    }
  };

  const handleSave = async () => {
    if (!canSaveEntry(paragraphs)) {
      setMessage({
        type: "error",
        text: "Write at least one paragraph before saving.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const today = new Date().toISOString().split("T")[0];
    const entry: StoredJournalEntry = {
      id: selectedId ?? crypto.randomUUID(),
      title: title.trim() || formatTodayDisplay(),
      date: today,
      paragraphs,
      status: "saved",
    };

    try {
      const saved = await saveEntryApi(entry);
      setSelectedId(saved.id);
      await refreshEntries();
      setMessage({ type: "success", text: "Saved" });
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : "Failed to save entry.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  };

  const resetEditor = () => {
    const first = createParagraph();
    setTitle(formatTodayDisplay());
    setParagraphs([first]);
    setActiveParagraphId(first.id);
    setSelectedId(null);
    setMockMode(false);
    setEntryReview(null);
  };

  const handleNewEntry = () => {
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
    try {
      const stored = await fetchEntry(entry.id);
      setSelectedId(stored.id);
      setTitle(stored.title);
      setParagraphs(stored.paragraphs);
      setEntryReview(null);

      const firstAnalyzed = stored.paragraphs.find((p) => p.analysis);
      const activeId = firstAnalyzed?.id ?? stored.paragraphs[0]?.id ?? null;
      setActiveParagraphId(activeId);
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
            <span className="dot" aria-hidden />
            <h1>English Journal</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setDrawerMessage(null);
              setEntriesOpen(true);
            }}
            className="feedback-btn alt"
          >
            ▤ Entries <span className="n">{entries.length}</span>
          </button>
        </div>
        <div className="top-actions">
          {user.email && <span className="who">{user.email}</span>}
          <button type="button" onClick={handleNewEntry} className="lnk">
            New entry
          </button>
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
            }}
            className="lnk"
            title={user.email ?? "Sign out"}
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={handleOpenFeedback}
            className="feedback-btn"
          >
            <span className="pen" aria-hidden>
              ✎
            </span>{" "}
            Feedback
            {inlineNoteCount > 0 && (
              <span className="n">{inlineNoteCount}</span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-sheet px-4 py-8 sm:px-6 sm:py-12">
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

        <div className="mb-8">
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={formatTodayDisplay()}
            className="w-full border-0 bg-transparent font-display text-2xl font-semibold text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0 sm:text-3xl"
          />
          <p className="mt-1 font-sans text-xs text-ink-400">
            {wordCount} {wordCount === 1 ? "word" : "words"} ·{" "}
            {paragraphs.length}{" "}
            {paragraphs.length === 1 ? "paragraph" : "paragraphs"}
          </p>
        </div>

        <ParagraphEditor
          paragraphs={paragraphs}
          activeParagraphId={activeParagraphId}
          analyzingParagraphId={analyzingParagraphId}
          onParagraphsChange={handleParagraphsChange}
          onActiveParagraphChange={setActiveParagraphId}
          onAnalyzeParagraph={handleAnalyzeParagraph}
        />

        <div className="mt-8 flex justify-end border-t border-paper-line/60 pt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSaveEntry(paragraphs)}
            className="rounded border border-pen/30 bg-white/60 px-5 py-2.5 font-sans text-sm font-medium text-pen transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
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
        onNewEntry={handleNewEntry}
        onDelete={handleDeleteEntry}
      />

      <FeedbackDrawer
        open={feedbackOpen}
        review={entryReview}
        loading={reviewLoading}
        onClose={() => setFeedbackOpen(false)}
        onRequestReview={handleRequestReview}
      />
    </div>
  );
}
