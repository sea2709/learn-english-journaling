"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SocialAuthButtons } from "./SocialAuthButtons";

type AuthMode = "login" | "register";
type AuthStep = "choose" | "email" | "forgot";

const RESET_SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a reset link.";

export function AuthForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const urlAuthError =
    searchParams.get("error") === "auth"
      ? "Sign in was cancelled or failed. Please try again."
      : null;
  const error = formError ?? urlAuthError;

  const resetMessages = () => {
    setFormError(null);
    setMessage(null);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetMessages();
    setStep("choose");
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    resetMessages();

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      );

      if (resetError) {
        setFormError(resetError.message);
        return;
      }

      setMessage(RESET_SUCCESS_MESSAGE);
    } catch {
      setFormError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    resetMessages();

    const supabase = createClient();

    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim() || null,
            },
          },
        });

        if (signUpError) {
          setFormError(signUpError.message);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setMessage(
            "Account created. Check your email to confirm your address, then sign in."
          );
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setFormError("Invalid email or password.");
        }
      }
    } catch {
      setFormError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const heading =
    step === "forgot"
      ? "Reset your password."
      : mode === "login"
        ? "Welcome back."
        : "Join English Journal.";
  const subheading =
    step === "forgot"
      ? "Enter your email and we will send a reset link."
      : mode === "login"
        ? "Sign in to continue your writing practice."
        : "Create an account to save entries and sync across devices.";

  return (
    <div className="flex min-h-screen items-center justify-center paper-texture px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            {heading}
          </h1>
          <p className="mt-2 text-sm text-ink-500">{subheading}</p>
          {step === "choose" && (
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              English Journal helps you learn English through daily writing.
              Craft entries paragraph by paragraph, get AI feedback on grammar,
              tone, and word choice, then save your progress across devices.
            </p>
          )}
        </div>

        {step === "choose" ? (
          <div className="space-y-6">
            <SocialAuthButtons />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-ink-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
                or
              </span>
              <div className="h-px flex-1 bg-ink-200" />
            </div>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setStep("email");
              }}
              className="w-full rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
            >
              Sign {mode === "login" ? "in" : "up"} with email
            </button>

            <p className="text-center text-sm text-ink-500">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-medium text-sage-700 underline-offset-2 hover:underline"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-medium text-sage-700 underline-offset-2 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        ) : step === "forgot" ? (
          <div className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setStep("email");
              }}
              className="mb-5 flex items-center gap-1 text-sm text-ink-500 transition hover:text-ink-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500"
                >
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2 text-sm text-ink-900 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-sage-200 bg-sage-50 px-3 py-2 text-sm text-sage-800">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending link…" : "Send reset link"}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setStep("choose");
              }}
              className="mb-5 flex items-center gap-1 text-sm text-ink-500 transition hover:text-ink-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500"
                  >
                    Name (optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2 text-sm text-ink-900 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2 text-sm text-ink-900 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wide text-ink-500"
                  >
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setStep("forgot");
                      }}
                      className="text-xs font-medium text-sage-700 underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2 text-sm text-ink-900 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
                />
                {mode === "register" && (
                  <p className="mt-1 text-xs text-ink-400">
                    At least 8 characters.
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-sage-200 bg-sage-50 px-3 py-2 text-sm text-sage-800">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? mode === "register"
                    ? "Creating account…"
                    : "Signing in…"
                  : mode === "register"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-ink-500">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-medium text-sage-700 underline-offset-2 hover:underline"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-medium text-sage-700 underline-offset-2 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-relaxed text-ink-400">
          By continuing, you agree to our terms of service and acknowledge our
          privacy policy.
        </p>
      </div>
    </div>
  );
}
