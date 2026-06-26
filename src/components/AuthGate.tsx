"use client";

import { Suspense, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "./AuthForm";
import { JournalApp } from "./JournalApp";

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center paper-texture">
        <p className="text-sm text-ink-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center paper-texture">
            <p className="text-sm text-ink-500">Loading…</p>
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    );
  }

  return <JournalApp user={user} />;
}
