"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setHasSession(!!session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(!!session);
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center paper-texture px-4 py-12">
        <p className="text-sm text-ink-500">Loading…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center paper-texture px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Link expired
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            This reset link is invalid or has expired. Request a new one from
            the sign-in page.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center paper-texture px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Choose a new password.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Enter a new password for your account. At least 8 characters.
          </p>
        </div>

        <div className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2 text-sm text-ink-900 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2 text-sm text-ink-900 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
