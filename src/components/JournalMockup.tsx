"use client";

import { useState } from "react";
import type { AnalysisResult, JournalEntry } from "@/lib/types";
import {
  MOCK_ENTRIES,
  SAMPLE_ANALYSIS,
  SAMPLE_PARAGRAPH,
  SAMPLE_TITLE,
  delay,
  generateMockAnalysis,
  getMockAnalysisForEntry,
} from "@/lib/mock-data";
import { EntryList } from "./EntryList";
import { FeedbackPanel } from "./FeedbackPanel";

export function JournalMockup() {
  const [title, setTitle] = useState(SAMPLE_TITLE);
  const [text, setText] = useState(SAMPLE_PARAGRAPH);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(SAMPLE_ANALYSIS);
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>("mock-1");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setMessage({ type: "error", text: "Please write something first." });
      return;
    }

    setAnalyzing(true);
    setMessage(null);
    setSelectedId(null);
    setAnalysis(null);

    await delay(1400);

    setAnalysis(generateMockAnalysis(text));
    setAnalyzing(false);
  };

  const handleSave = async () => {
    if (!analysis) {
      setMessage({ type: "error", text: "Get feedback before saving." });
      return;
    }

    setSaving(true);
    setMessage(null);
    await delay(800);

    const today = new Date().toISOString().split("T")[0];
    const newEntry: JournalEntry = {
      id: `mock-${Date.now()}`,
      title: title || `Journal ${today}`,
      date: today,
      originalText: text,
      correctedText: analysis.correctedText,
      tone: analysis.tone,
      grammarScore: analysis.grammarScore,
      status: "saved",
    };

    setEntries((prev) => [newEntry, ...prev]);
    setSelectedId(newEntry.id);
    setMessage({
      type: "success",
      text: "Saved to Notion (prototype — no real sync yet).",
    });
    setSaving(false);
  };

  const handleNewEntry = () => {
    setTitle("");
    setText("");
    setAnalysis(null);
    setSelectedId(null);
    setMessage(null);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedId(entry.id);
    setTitle(entry.title);
    setText(entry.originalText);
    setAnalysis(
      getMockAnalysisForEntry(entry.id) ?? {
        correctedText: entry.correctedText,
        tone: (entry.tone as AnalysisResult["tone"]) || "neutral",
        grammarScore: entry.grammarScore ?? 0,
        summary: `Saved entry from ${entry.date}.`,
        suggestions: [],
      }
    );
    setMessage(null);
  };

  return (
    <div className="min-h-screen paper-texture">
      <div className="border-b border-amber-200 bg-amber-50/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Prototype mockup</span> — interactive UI
            preview with sample data. No API keys or Notion connection required.
          </p>
          <span className="hidden shrink-0 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-medium text-amber-900 sm:inline">
            v0 mock
          </span>
        </div>
      </div>

      <header className="border-b border-ink-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink-900">
              English Journal
            </h1>
            <p className="text-sm text-ink-500">
              Write daily. Learn naturally. Stored in Notion.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewEntry}
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50"
          >
            New entry
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "border border-sage-200 bg-sage-50 text-sage-800"
                : "border border-coral-200 bg-coral-50 text-coral-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <EntryList
              entries={entries}
              loading={false}
              selectedId={selectedId}
              onSelect={handleSelectEntry}
              onRefresh={() =>
                setMessage({
                  type: "success",
                  text: "Refreshed (prototype uses local sample data).",
                })
              }
            />
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-sm">
              <label
                htmlFor="title"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500"
              >
                Title (optional)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Today's reflection"
                className="mb-4 w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
              />

              <label
                htmlFor="journal"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500"
              >
                Your paragraph
              </label>
              <textarea
                id="journal"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (selectedId) setSelectedId(null);
                }}
                placeholder="Write about your day, your thoughts, or anything on your mind. Don't worry about mistakes — that's how we learn."
                rows={12}
                className="w-full resize-y rounded-xl border border-ink-200 bg-ink-50/30 px-4 py-3 font-serif text-base leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-ink-500">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing || !text.trim()}
                    className="rounded-lg bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analyzing ? "Analyzing…" : "Get feedback"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !analysis}
                    className="rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save to Notion"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <FeedbackPanel analysis={analysis} loading={analyzing} />
          </div>
        </div>
      </main>
    </div>
  );
}
