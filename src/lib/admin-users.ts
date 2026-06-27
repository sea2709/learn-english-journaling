import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminStats, AdminUserRow, AdminUsersResponse } from "@/lib/types";

type SortField = "created_at" | "last_sign_in_at" | "email";

/** Maps a raw Supabase auth user to the AdminUserRow shape. */
export function mapAdminUser(user: {
  id: string;
  email?: string;
  app_metadata?: { provider?: string; providers?: string[] };
  created_at: string;
  last_sign_in_at?: string | null;
}): AdminUserRow {
  const providers: string[] =
    user.app_metadata?.providers ??
    (user.app_metadata?.provider ? [user.app_metadata.provider] : []);

  return {
    id: user.id,
    email: user.email ?? "(no email)",
    providers,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

/**
 * Fetches all users via the admin API and returns paginated + sorted results.
 * Supabase's listUsers paginates server-side; we fetch page by page to sort
 * across the full set.
 */
export async function listAllUsers(
  adminClient: SupabaseClient,
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: SortField;
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<AdminUsersResponse> {
  const { page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" } =
    options;

  // Fetch all pages from Supabase so we can sort across the full set.
  const allUsers: ReturnType<typeof mapAdminUser>[] = [];
  let supabasePage = 1;
  const fetchSize = 1000;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: supabasePage,
      perPage: fetchSize,
    });

    if (error) throw error;
    if (!data || data.users.length === 0) break;

    allUsers.push(...data.users.map(mapAdminUser));

    if (data.users.length < fetchSize) break;
    supabasePage++;
  }

  // Sort the full list.
  allUsers.sort((a, b) => {
    let valA: string | null;
    let valB: string | null;

    if (sortBy === "email") {
      valA = a.email;
      valB = b.email;
    } else if (sortBy === "last_sign_in_at") {
      valA = a.lastSignInAt;
      valB = b.lastSignInAt;
    } else {
      valA = a.createdAt;
      valB = b.createdAt;
    }

    const cmp = (valA ?? "").localeCompare(valB ?? "");
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const total = allUsers.length;
  const start = (page - 1) * pageSize;
  const users = allUsers.slice(start, start + pageSize);

  return { users, total, page, pageSize };
}

function countAfter(
  users: AdminUserRow[],
  field: "createdAt" | "lastSignInAt",
  since: Date
): number {
  return users.filter((u) => {
    const val = u[field];
    if (!val) return false;
    return new Date(val) >= since;
  }).length;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (n - 1));
  return d;
}

/** Computes engagement statistics from the full user list. */
export async function getAuthStats(
  adminClient: SupabaseClient
): Promise<AdminStats> {
  // Fetch all users for stats calculation.
  const allUsers: AdminUserRow[] = [];
  let supabasePage = 1;
  const fetchSize = 1000;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: supabasePage,
      perPage: fetchSize,
    });

    if (error) throw error;
    if (!data || data.users.length === 0) break;

    allUsers.push(...data.users.map(mapAdminUser));

    if (data.users.length < fetchSize) break;
    supabasePage++;
  }

  return {
    totalUsers: allUsers.length,
    newSignups: {
      today: countAfter(allUsers, "createdAt", daysAgo(1)),
      last3Days: countAfter(allUsers, "createdAt", daysAgo(3)),
      last7Days: countAfter(allUsers, "createdAt", daysAgo(7)),
      last30Days: countAfter(allUsers, "createdAt", daysAgo(30)),
    },
    activeLogins: {
      today: countAfter(allUsers, "lastSignInAt", daysAgo(1)),
      last3Days: countAfter(allUsers, "lastSignInAt", daysAgo(3)),
      last7Days: countAfter(allUsers, "lastSignInAt", daysAgo(7)),
      last30Days: countAfter(allUsers, "lastSignInAt", daysAgo(30)),
    },
  };
}
