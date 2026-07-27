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
  successMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: ChangePasswordPayload) => void;
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  if (crossed) {
    return (
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
          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
        />
      </svg>
    );
  }

  return (
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
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  autoComplete,
  visible,
  onToggleVisible,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          minLength={autoComplete === "current-password" ? undefined : 8}
          className="w-full rounded border border-paper-line bg-white/80 px-3 py-2 pr-10 font-sans text-sm text-ink-800 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 transition hover:text-ink-700"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>
    </div>
  );
}

function ChangePasswordFormPanel({
  submitting,
  error,
  successMessage,
  onClose,
  onSubmit,
}: Omit<ChangePasswordFormProps, "open">) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
          {successMessage ? (
            <div className="rounded bg-sage-100/60 px-4 py-3 font-sans text-sm text-sage-800">
              {successMessage}
            </div>
          ) : (
            <>
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
                <PasswordField
                  id="current-password"
                  label="Current password"
                  value={currentPassword}
                  autoComplete="current-password"
                  visible={showCurrent}
                  onToggleVisible={() => setShowCurrent((v) => !v)}
                  onChange={(value) => {
                    setCurrentPassword(value);
                    setValidationError(null);
                  }}
                />
                <PasswordField
                  id="change-new-password"
                  label="New password"
                  value={newPassword}
                  autoComplete="new-password"
                  visible={showNew}
                  onToggleVisible={() => setShowNew((v) => !v)}
                  onChange={(value) => {
                    setNewPassword(value);
                    setValidationError(null);
                  }}
                />
                <PasswordField
                  id="change-confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  visible={showConfirm}
                  onToggleVisible={() => setShowConfirm((v) => !v)}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setValidationError(null);
                  }}
                />

                {(validationError || error) && (
                  <p className="rounded bg-coral-100/60 px-3 py-2 text-sm text-coral-800">
                    {validationError ?? error}
                  </p>
                )}

                <button type="submit" className="sr-only" tabIndex={-1}>
                  Update password
                </button>
              </form>
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
              {submitting ? "Updating…" : "Update password"}
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

export function ChangePasswordForm({
  open,
  submitting,
  error,
  successMessage,
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
      successMessage={successMessage}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
