"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdminStats, AdminUserRow, AdminUsersResponse } from "@/lib/types";

type SortField = "created_at" | "last_sign_in_at" | "email";
type SortOrder = "asc" | "desc";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-ink-200/60 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

function PeriodRow({
  label,
  signups,
  logins,
}: {
  label: string;
  signups: number;
  logins: number;
}) {
  return (
    <tr className="border-b border-ink-100 last:border-0">
      <td className="py-3 pr-6 text-sm font-medium text-ink-700">{label}</td>
      <td className="py-3 pr-6 text-sm text-ink-900">{signups}</td>
      <td className="py-3 text-sm text-ink-900">{logins}</td>
    </tr>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    email: "bg-ink-100 text-ink-700",
    google: "bg-blue-50 text-blue-700",
    facebook: "bg-indigo-50 text-indigo-700",
  };
  const cls = colors[provider] ?? "bg-sage-50 text-sage-700";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls} mr-1`}
    >
      {provider}
    </span>
  );
}

function SortButton({
  field,
  label,
  current,
  order,
  onSort,
}: {
  field: SortField;
  label: string;
  current: SortField;
  order: SortOrder;
  onSort: (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-600 hover:text-ink-900"
    >
      {label}
      {active ? (
        <span aria-hidden>{order === "asc" ? " ↑" : " ↓"}</span>
      ) : (
        <span className="text-ink-300" aria-hidden>
          {" "}
          ↕
        </span>
      )}
    </button>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingStats(true);
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setStatsError(data.error);
        else setStats(data.stats);
      })
      .catch(() => setStatsError("Failed to load stats."))
      .finally(() => setLoadingStats(false));
  }, []);

  const fetchUsers = useCallback(() => {
    setLoadingUsers(true);
    setUsersError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortOrder,
    });
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((data: AdminUsersResponse & { error?: string }) => {
        if (data.error) setUsersError(data.error);
        else {
          setUsers(data.users);
          setTotal(data.total);
        }
      })
      .catch(() => setUsersError("Failed to load users."))
      .finally(() => setLoadingUsers(false));
  }, [page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSort(field: SortField) {
    if (field === sortBy) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-ink-50 p-6 font-sans">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Admin Dashboard</h1>
            <p className="mt-0.5 text-sm text-ink-500">
              User engagement overview
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50"
          >
            ← Back to Journal
          </a>
        </div>

        {/* Stats */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-600">
            Engagement overview
          </h2>

          {loadingStats ? (
            <div className="text-sm text-ink-500">Loading stats…</div>
          ) : statsError ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {statsError}
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Users" value={stats.totalUsers} />
                <StatCard
                  label="New Today"
                  value={stats.newSignups.today}
                />
                <StatCard
                  label="New (7 days)"
                  value={stats.newSignups.last7Days}
                />
                <StatCard
                  label="New (30 days)"
                  value={stats.newSignups.last30Days}
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-ink-200/60 bg-white shadow-sm">
                <div className="border-b border-ink-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-ink-700">
                    Signups &amp; Active Logins by Period
                  </h3>
                </div>
                <div className="overflow-x-auto px-5">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink-100">
                        <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                          Period
                        </th>
                        <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                          New Signups
                        </th>
                        <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                          Active Logins
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <PeriodRow
                        label="Today"
                        signups={stats.newSignups.today}
                        logins={stats.activeLogins.today}
                      />
                      <PeriodRow
                        label="Last 3 days"
                        signups={stats.newSignups.last3Days}
                        logins={stats.activeLogins.last3Days}
                      />
                      <PeriodRow
                        label="Last 7 days"
                        signups={stats.newSignups.last7Days}
                        logins={stats.activeLogins.last7Days}
                      />
                      <PeriodRow
                        label="Last 30 days"
                        signups={stats.newSignups.last30Days}
                        logins={stats.activeLogins.last30Days}
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* User list */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
              Users
              {total > 0 && (
                <span className="ml-1.5 font-normal normal-case text-ink-400">
                  ({total})
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-sage-700 transition hover:bg-sage-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {usersError ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {usersError}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-ink-200/60 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-ink-100">
                    <tr>
                      <th className="px-5 py-3 text-left">
                        <SortButton
                          field="email"
                          label="Email"
                          current={sortBy}
                          order={sortOrder}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
                        Providers
                      </th>
                      <th className="px-5 py-3 text-left">
                        <SortButton
                          field="created_at"
                          label="Signed Up"
                          current={sortBy}
                          order={sortOrder}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-5 py-3 text-left">
                        <SortButton
                          field="last_sign_in_at"
                          label="Last Login"
                          current={sortBy}
                          order={sortOrder}
                          onSort={handleSort}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-8 text-center text-sm text-ink-500"
                        >
                          Loading users…
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-8 text-center text-sm text-ink-500"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50"
                        >
                          <td className="px-5 py-3 text-sm text-ink-900">
                            {u.email}
                          </td>
                          <td className="px-5 py-3">
                            {u.providers.length > 0
                              ? u.providers.map((p) => (
                                  <ProviderBadge key={p} provider={p} />
                                ))
                              : <span className="text-xs text-ink-400">—</span>}
                          </td>
                          <td className="px-5 py-3 text-sm text-ink-700">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-sm text-ink-700">
                            {formatDate(u.lastSignInAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3">
                  <p className="text-xs text-ink-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loadingUsers}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages || loadingUsers}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
