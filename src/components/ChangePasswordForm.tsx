"use client";

import { useEffect, useState } from "react";

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordFormProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: ChangePasswordPayload) => void;
}

function ChangePasswordFormPanel({
  submitting,
  error,
  onClose,
  onSubmit,
}: Omit<ChangePasswordFormProps, "open">) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setValidationError("New password must be different from the current one.");
      return;
    }

    setValidationError(null);
    onSubmit({ currentPassword, newPassword });
  };

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
        aria-label="Change password"
      >
        <header className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Change password
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded p-1.5 text-ink-500 transition hover:bg-paper-dark hover:text-ink-800 sm:min-h-0 sm:min-w-0"
            aria-label="Close change password"
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
          <p className="text-sm leading-relaxed text-ink-600">
            Enter your current password, then choose a new one. At least 8
            characters.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div>
              <label
                htmlFor="current-password"
                className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
              >
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  setValidationError(null);
                }}
                autoComplete="current-password"
                required
                className="w-full rounded border border-paper-line bg-white/80 px-3 py-2 font-sans text-sm text-ink-800 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
              />
            </div>

            <div>
              <label
                htmlFor="change-new-password"
                className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
              >
                New password
              </label>
              <input
                id="change-new-password"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setValidationError(null);
                }}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded border border-paper-line bg-white/80 px-3 py-2 font-sans text-sm text-ink-800 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
              />
            </div>

            <div>
              <label
                htmlFor="change-confirm-password"
                className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
              >
                Confirm new password
              </label>
              <input
                id="change-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setValidationError(null);
                }}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded border border-paper-line bg-white/80 px-3 py-2 font-sans text-sm text-ink-800 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
              />
            </div>

            {(validationError || error) && (
              <p className="rounded bg-coral-100/60 px-3 py-2 text-sm text-coral-800">
                {validationError ?? error}
              </p>
            )}

            <button type="submit" className="sr-only" tabIndex={-1}>
              Update password
            </button>
          </form>
        </div>

        <footer className="border-t border-paper-line px-5 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="feedback-btn w-full justify-center"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </footer>
      </aside>
    </>
  );
}

export function ChangePasswordForm({
  open,
  submitting,
  error,
  onClose,
  onSubmit,
}: ChangePasswordFormProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ChangePasswordFormPanel
      key="change-password"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
