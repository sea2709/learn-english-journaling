"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminStats,
  AdminUserRow,
  AdminUserSort,
  AdminUsersResponse,
} from "@/lib/types";
import { ApiError, fetchAdminStats, fetchAdminUsers } from "@/lib/api";

const PER_PAGE = 20;

const sortLabels: Record<AdminUserSort, string> = {
  created_at: "Signup date",
  last_sign_in_at: "Last login",
  email: "Email",
};

function formatDate(value: string | null): string {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200/60 bg-white/80 p-5 shadow-sm">
      <p className="font-sans text-xs font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold text-ink-900">
        {value.toLocaleString()}
      </p>
      {detail && <p className="mt-1 text-sm text-ink-500">{detail}</p>}
    </div>
  );
}

function WindowStats({
  title,
  counts,
}: {
  title: string;
  counts: AdminStats["newSignups"];
}) {
  return (
    <div className="rounded-2xl border border-ink-200/60 bg-white/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <span className="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700 ring-1 ring-sage-200">
          rolling
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Today", counts.today],
          ["3d", counts.last3Days],
          ["7d", counts.last7Days],
          ["30d", counts.last30Days],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-ink-50 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              {label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
              {Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortButton({
  label,
  sort,
  currentSort,
  ascending,
  onSort,
}: {
  label: string;
  sort: AdminUserSort;
  currentSort: AdminUserSort;
  ascending: boolean;
  onSort: (sort: AdminUserSort) => void;
}) {
  const active = sort === currentSort;

  return (
    <button
      type="button"
      onClick={() => onSort(sort)}
      className="inline-flex items-center gap-1 font-semibold text-ink-600 transition hover:text-ink-900"
      aria-sort={
        active ? (ascending ? "ascending" : "descending") : undefined
      }
    >
      {label}
      <span className="text-ink-300" aria-hidden>
        {active ? (ascending ? "asc" : "desc") : "sort"}
      </span>
    </button>
  );
}

function UserRow({ user }: { user: AdminUserRow }) {
  return (
    <tr className="border-t border-ink-100">
      <td className="min-w-64 px-4 py-3 text-sm font-medium text-ink-900">
        {user.email}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {user.providers.map((provider) => (
            <span
              key={provider}
              className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600"
            >
              {provider}
            </span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
        {formatDate(user.createdAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
        {formatDateTime(user.lastSignInAt)}
      </td>
    </tr>
  );
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersResponse, setUsersResponse] =
    useState<AdminUsersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<AdminUserSort>("created_at");
  const [ascending, setAscending] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const nextStats = await fetchAdminStats();
      setStats(nextStats);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load admin stats."
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const nextUsers = await fetchAdminUsers({
        page,
        perPage: PER_PAGE,
        sort,
        ascending,
      });
      setUsersResponse(nextUsers);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load admin users."
      );
    } finally {
      setUsersLoading(false);
    }
  }, [ascending, page, sort]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const visibleRange = useMemo(() => {
    if (!usersResponse || usersResponse.total === 0) return "0 users";

    const start = (usersResponse.page - 1) * usersResponse.perPage + 1;
    const end = Math.min(
      usersResponse.page * usersResponse.perPage,
      usersResponse.total
    );
    return `${start}-${end} of ${usersResponse.total.toLocaleString()} users`;
  }, [usersResponse]);

  const handleSort = (nextSort: AdminUserSort) => {
    setPage(1);
    if (nextSort === sort) {
      setAscending((current) => !current);
      return;
    }

    setSort(nextSort);
    setAscending(nextSort === "email");
  };

  return (
    <div className="min-h-screen paper-texture">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <span className="dot" aria-hidden />
            <h1>Admin</h1>
          </div>
          <span className="hidden rounded-full bg-white/50 px-3 py-1 text-xs text-ink-500 ring-1 ring-ink-200/70 sm:inline-flex">
            {adminEmail}
          </span>
        </div>
        <div className="top-actions">
          <a href="/" className="lnk">
            Journal
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-sage-700">
            Engagement overview
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            User activity
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Supabase Auth users, signups, and recent login activity for
            allowlisted admins.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded border border-coral-200 bg-coral-50 px-4 py-2.5 font-sans text-sm text-coral-800">
            {error}
          </div>
        )}

        {statsLoading || !stats ? (
          <div className="mb-8 rounded-2xl border border-ink-200/60 bg-white/70 p-6 text-sm text-ink-500 shadow-sm">
            Loading engagement stats...
          </div>
        ) : (
          <section className="mb-8 grid gap-4">
            <StatCard
              label="Total users"
              value={stats.totalUsers}
              detail="All Supabase Auth accounts"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <WindowStats title="New signups" counts={stats.newSignups} />
              <WindowStats title="Active logins" counts={stats.activeLogins} />
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-ink-200/60 bg-white/85 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Users
              </h2>
              <p className="mt-1 text-sm text-ink-500">{visibleRange}</p>
            </div>
            <p className="text-xs text-ink-400">
              Sorted by {sortLabels[sort]}{" "}
              {ascending ? "ascending" : "descending"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left font-sans">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3">
                    <SortButton
                      label="Email"
                      sort="email"
                      currentSort={sort}
                      ascending={ascending}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Providers</th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Signup"
                      sort="created_at"
                      currentSort={sort}
                      ascending={ascending}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Last login"
                      sort="last_sign_in_at"
                      currentSort={sort}
                      ascending={ascending}
                      onSort={handleSort}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-ink-500">
                      Loading users...
                    </td>
                  </tr>
                ) : usersResponse?.users.length ? (
                  usersResponse.users.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-ink-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-500">
              Page {usersResponse?.page ?? page} of{" "}
              {usersResponse?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={usersLoading || (usersResponse?.page ?? 1) <= 1}
                className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(usersResponse?.totalPages ?? current, current + 1)
                  )
                }
                disabled={
                  usersLoading ||
                  (usersResponse?.page ?? 1) >=
                    (usersResponse?.totalPages ?? 1)
                }
                className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
