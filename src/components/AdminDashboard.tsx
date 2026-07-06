"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchAdminStats, fetchAdminUsers } from "@/lib/api";
import type { AdminStats, AdminUserRow, AdminUserSort } from "@/lib/types";
import { AdminFeedbackSection } from "./AdminFeedbackSection";

type SortOrder = "asc" | "desc";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatProviders(providers: string[]) {
  return providers
    .map((provider) => {
      if (provider === "google") return "Google";
      if (provider === "facebook") return "Facebook";
      if (provider === "email") return "Email";
      return provider;
    })
    .join(", ");
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent
          ? "border-sage-300 bg-sage-50"
          : "border-paper-line bg-white/40"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function SortButton({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: SortOrder;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-left text-xs font-medium transition ${
        active
          ? "bg-sage-100 text-sage-800"
          : "text-ink-600 hover:bg-paper-dark hover:text-ink-800"
      }`}
    >
      {label}
      {active ? <span aria-hidden>{order === "asc" ? "↑" : "↓"}</span> : null}
    </button>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [sort, setSort] = useState<AdminUserSort>("created_at");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextStats, usersResponse] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers({ page, perPage, sort, order }),
      ]);

      setStats(nextStats);
      setUsers(usersResponse.users);
      setTotalUsers(usersResponse.total);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load admin dashboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [order, page, perPage, sort]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / perPage));

  function handleSort(nextSort: AdminUserSort) {
    if (sort === nextSort) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(nextSort);
      setOrder(nextSort === "email" ? "asc" : "desc");
    }
    setPage(1);
  }

  return (
    <div className="paper-texture min-h-screen">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <span className="dot" aria-hidden />
            <h1>Admin Dashboard</h1>
          </div>
        </div>
        <div className="top-actions">
          <Link href="/" className="lnk">
            Back to journal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-6 rounded-lg border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
            {error}
          </div>
        ) : null}

        <section className="mb-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">
            Engagement overview
          </h2>

          {loading && !stats ? (
            <p className="text-sm text-ink-500">Loading stats…</p>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Total users" value={stats.totalUsers} accent />
                <StatCard label="Signups today" value={stats.signupsToday} />
                <StatCard label="Signups (3d)" value={stats.signupsLast3Days} />
                <StatCard label="Signups (7d)" value={stats.signupsLast7Days} />
                <StatCard label="Signups (30d)" value={stats.signupsLast30Days} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active today" value={stats.activeToday} accent />
                <StatCard label="Active (3d)" value={stats.activeLast3Days} />
                <StatCard label="Active (7d)" value={stats.activeLast7Days} />
                <StatCard label="Active (30d)" value={stats.activeLast30Days} />
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Users
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {totalUsers.toLocaleString()} total
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-paper-line bg-white/50">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-paper-line bg-paper-dark/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-ink-700">
                      <SortButton
                        label="Email"
                        active={sort === "email"}
                        order={order}
                        onClick={() => handleSort("email")}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-ink-700">
                      Providers
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-ink-700">
                      <SortButton
                        label="Signed up"
                        active={sort === "created_at"}
                        order={order}
                        onClick={() => handleSort("created_at")}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-ink-700">
                      <SortButton
                        label="Last login"
                        active={sort === "last_sign_in_at"}
                        order={order}
                        onClick={() => handleSort("last_sign_in_at")}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-ink-500"
                      >
                        Loading users…
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-ink-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-paper-line/70 last:border-b-0"
                      >
                        <td className="px-4 py-3 font-mono text-ink-900">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {formatProviders(user.providers)}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {formatDateTime(user.lastSignInAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-paper-line px-4 py-3">
                <p className="text-xs text-ink-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || loading}
                    className="rounded border border-paper-line px-3 py-1.5 text-xs text-ink-700 transition hover:bg-paper-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page >= totalPages || loading}
                    className="rounded border border-paper-line px-3 py-1.5 text-xs text-ink-700 transition hover:bg-paper-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <AdminFeedbackSection />
      </main>
    </div>
  );
}
