"use client";

import { useEffect, useState } from "react";
import {
  ALL_FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
} from "@/lib/feedback-schema";
import type { FeedbackCategory, UserFeedbackSubmission } from "@/lib/types";

interface FeedbackFormProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  successMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: UserFeedbackSubmission) => void;
}

export function FeedbackForm({
  open,
  submitting,
  error,
  successMessage,
  onClose,
  onSubmit,
}: FeedbackFormProps) {
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || successMessage) return;

    setCategory("idea");
    setMessage("");
    setContactNote("");
    setValidationError(null);
  }, [open, successMessage]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    const trimmedContact = contactNote.trim();

    if (!trimmedMessage) {
      setValidationError("Message is required.");
      return;
    }

    if (trimmedMessage.length > 2000) {
      setValidationError("Message must be 2000 characters or fewer.");
      return;
    }

    if (trimmedContact.length > 300) {
      setValidationError("Contact note must be 300 characters or fewer.");
      return;
    }

    setValidationError(null);
    onSubmit({
      category,
      message: trimmedMessage,
      contactNote: trimmedContact || undefined,
    });
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in bg-ink-950/25"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full animate-drawer-in-right flex-col bg-paper shadow-xl sm:w-[380px] sm:max-w-[calc(100vw-2rem)]"
        role="dialog"
        aria-label="Send feedback"
      >
        <header className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Send feedback
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded p-1.5 text-ink-500 transition hover:bg-paper-dark hover:text-ink-800 sm:min-h-0 sm:min-w-0"
            aria-label="Close feedback form"
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {successMessage ? (
            <div className="rounded bg-sage-100/60 px-4 py-3 font-sans text-sm text-sage-800">
              {successMessage}
            </div>
          ) : (
            <>
          <p className="text-sm leading-relaxed text-ink-600">
            Tell us about a bug, share an idea, or let us know how the app is
            working for you.
          </p>

          <fieldset className="mt-6 space-y-2">
            <legend className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-500">
              Category
            </legend>
            <div className="flex flex-wrap gap-2">
              {ALL_FEEDBACK_CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    category === value
                      ? "border-pen bg-pen/10 text-ink-900"
                      : "border-paper-line text-ink-700 hover:bg-paper-dark/60"
                  }`}
                >
                  {FEEDBACK_CATEGORY_LABELS[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <label
              htmlFor="feedback-message"
              className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
            >
              Message
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setValidationError(null);
              }}
              rows={6}
              maxLength={2000}
              placeholder="Describe your feedback…"
              className="w-full resize-none rounded border border-paper-line bg-white/80 px-3 py-2 font-sans text-sm text-ink-800 placeholder:text-ink-400 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
            />
            <p className="mt-1 text-right text-[11px] text-ink-400">
              {message.length}/2000
            </p>
          </div>

          <div className="mt-4">
            <label
              htmlFor="feedback-contact"
              className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
            >
              Contact note (optional)
            </label>
            <textarea
              id="feedback-contact"
              value={contactNote}
              onChange={(e) => {
                setContactNote(e.target.value);
                setValidationError(null);
              }}
              rows={2}
              maxLength={300}
              placeholder='Optional — add an email or extra context if you would like a reply'
              className="w-full resize-none rounded border border-paper-line bg-white/80 px-3 py-2 font-sans text-sm text-ink-800 placeholder:text-ink-400 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
            />
            <p className="mt-1 text-right text-[11px] text-ink-400">
              {contactNote.length}/300
            </p>
          </div>

          {(validationError || error) && (
            <p className="mt-4 rounded bg-coral-100/60 px-3 py-2 text-sm text-coral-800">
              {validationError ?? error}
            </p>
          )}
            </>
          )}
        </div>

        <footer className="border-t border-paper-line px-5 py-4">
          {successMessage ? (
            <button
              type="button"
              onClick={onClose}
              className="feedback-btn w-full justify-center"
            >
              Close
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="feedback-btn w-full justify-center"
            >
              {submitting ? "Sending…" : "Send feedback"}
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}
