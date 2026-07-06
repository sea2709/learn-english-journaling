"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  fetchAdminFeedback,
  updateAdminFeedback,
} from "@/lib/api";
import {
  ALL_FEEDBACK_STATUSES,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/feedback-schema";
import type {
  AdminFeedbackRow,
  AdminFeedbackSort,
  FeedbackStatus,
} from "@/lib/types";

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

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function statusBadgeClass(status: FeedbackStatus) {
  if (status === "new") return "bg-sage-100 text-sage-800";
  if (status === "read") return "bg-paper-dark text-ink-700";
  return "bg-ink-100 text-ink-600";
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

function FeedbackDetailPanel({
  row,
  saving,
  error,
  onSave,
}: {
  row: AdminFeedbackRow;
  saving: boolean;
  error: string | null;
  onSave: (patch: {
    status: FeedbackStatus;
    internalNotes: string | null;
  }) => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(row.status);
  const [internalNotes, setInternalNotes] = useState(row.internalNotes ?? "");

  useEffect(() => {
    setStatus(row.status);
    setInternalNotes(row.internalNotes ?? "");
  }, [row]);

  return (
    <div className="border-t border-paper-line bg-paper-dark/30 px-4 py-4">
      <div className="space-y-3 text-sm text-ink-800">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
            Message
          </p>
          <p className="mt-1 whitespace-pre-wrap">{row.message}</p>
        </div>
        {row.contactNote ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
              Contact note
            </p>
            <p className="mt-1 whitespace-pre-wrap">{row.contactNote}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`feedback-status-${row.id}`}
            className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
          >
            Status
          </label>
          <select
            id={`feedback-status-${row.id}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
            className="w-full rounded border border-paper-line bg-white/80 px-3 py-2 text-sm text-ink-800 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
          >
            {ALL_FEEDBACK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {FEEDBACK_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor={`feedback-notes-${row.id}`}
          className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500"
        >
          Internal notes
        </label>
        <textarea
          id={`feedback-notes-${row.id}`}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Private notes for admin use only"
          className="w-full resize-none rounded border border-paper-line bg-white/80 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-pen/40 focus:outline-none focus:ring-2 focus:ring-pen/20"
        />
      </div>

      {error ? (
        <p className="mt-3 rounded bg-coral-100/60 px-3 py-2 text-sm text-coral-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() =>
            onSave({
              status,
              internalNotes: internalNotes.trim() || null,
            })
          }
          disabled={saving}
          className="rounded border border-paper-line bg-white px-4 py-2 text-sm font-medium text-ink-800 transition hover:bg-paper-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export function AdminFeedbackSection() {
  const [feedback, setFeedback] = useState<AdminFeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">(
    "all"
  );
  const [sort, setSort] = useState<AdminFeedbackSort>("created_at");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminFeedback({
        page,
        perPage,
        status: statusFilter === "all" ? undefined : statusFilter,
        sort,
        order,
      });

      setFeedback(response.feedback);
      setTotal(response.total);
      setNewCount(response.newCount);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load feedback.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [order, page, perPage, sort, statusFilter]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function handleSort(nextSort: AdminFeedbackSort) {
    if (sort === nextSort) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(nextSort);
      setOrder(nextSort === "status" ? "asc" : "desc");
    }
    setPage(1);
  }

  async function handleSave(
    id: string,
    patch: { status: FeedbackStatus; internalNotes: string | null }
  ) {
    setSavingId(id);
    setSaveError(null);

    try {
      const updated = await updateAdminFeedback(id, patch);
      setFeedback((current) => {
        const previous = current.find((row) => row.id === id);
        if (previous) {
          if (previous.status === "new" && updated.status !== "new") {
            setNewCount((count) => Math.max(0, count - 1));
          } else if (previous.status !== "new" && updated.status === "new") {
            setNewCount((count) => count + 1);
          }
        }
        return current.map((row) => (row.id === id ? updated : row));
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to update feedback.";
      setSaveError(message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900">
            User feedback
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {total.toLocaleString()} total
            {newCount > 0 ? ` · ${newCount.toLocaleString()} new` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...ALL_FEEDBACK_STATUSES] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatusFilter(value);
                setPage(1);
                setExpandedId(null);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                statusFilter === value
                  ? "border-pen bg-pen/10 text-ink-900"
                  : "border-paper-line text-ink-600 hover:bg-paper-dark/60"
              }`}
            >
              {value === "all" ? "All" : FEEDBACK_STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-paper-line bg-white/50">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-paper-line bg-paper-dark/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-ink-700">
                  <SortButton
                    label="Submitted"
                    active={sort === "created_at"}
                    order={order}
                    onClick={() => handleSort("created_at")}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-ink-700">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-ink-700">
                  <SortButton
                    label="Category"
                    active={sort === "category"}
                    order={order}
                    onClick={() => handleSort("category")}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-ink-700">
                  Message
                </th>
                <th className="px-4 py-3 text-left font-medium text-ink-700">
                  <SortButton
                    label="Status"
                    active={sort === "status"}
                    order={order}
                    onClick={() => handleSort("status")}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink-500"
                  >
                    Loading feedback…
                  </td>
                </tr>
              ) : feedback.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink-500"
                  >
                    No feedback found.
                  </td>
                </tr>
              ) : (
                feedback.map((row) => {
                  const expanded = expandedId === row.id;

                  return (
                    <Fragment key={row.id}>
                      <tr
                        className="cursor-pointer border-b border-paper-line/70 transition hover:bg-paper-dark/40"
                        onClick={() =>
                          setExpandedId((current) =>
                            current === row.id ? null : row.id
                          )
                        }
                      >
                        <td className="px-4 py-3 text-ink-700">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-mono text-ink-900">
                          {row.userEmail}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {FEEDBACK_CATEGORY_LABELS[row.category]}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-ink-700">
                          {truncate(row.message, 80)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                          >
                            {FEEDBACK_STATUS_LABELS[row.status]}
                          </span>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <FeedbackDetailPanel
                              row={row}
                              saving={savingId === row.id}
                              error={saveError}
                              onSave={(patch) => void handleSave(row.id, patch)}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
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
  );
}
