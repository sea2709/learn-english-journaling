import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
  AdminStats,
  AdminUserRow,
  AdminUsersResponse,
  AdminUserSort,
} from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const LIST_USERS_PAGE_SIZE = 1000;

function getTodayStart(now: Date): Date {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function countSince(users: User[], getDate: (user: User) => string | undefined | null, since: Date): number {
  return users.reduce((total, user) => {
    const value = getDate(user);
    if (!value) return total;

    return new Date(value) >= since ? total + 1 : total;
  }, 0);
}

function getProviders(user: User): string[] {
  const providers = new Set<string>();
  const metadataProvider = user.app_metadata.provider;
  const metadataProviders = user.app_metadata.providers;

  if (typeof metadataProvider === "string") {
    providers.add(metadataProvider);
  }

  if (Array.isArray(metadataProviders)) {
    metadataProviders.forEach((provider) => {
      if (typeof provider === "string") {
        providers.add(provider);
      }
    });
  }

  user.identities?.forEach((identity) => {
    if (identity.provider) {
      providers.add(identity.provider);
    }
  });

  if (providers.size === 0 && user.email) {
    providers.add("email");
  }

  return Array.from(providers).sort();
}

function compareNullableDates(
  a: string | null,
  b: string | null,
  ascending: boolean
): number {
  const left = a ? new Date(a).getTime() : 0;
  const right = b ? new Date(b).getTime() : 0;
  return ascending ? left - right : right - left;
}

function compareUsers(
  a: AdminUserRow,
  b: AdminUserRow,
  sort: AdminUserSort,
  ascending: boolean
): number {
  if (sort === "email") {
    const result = a.email.localeCompare(b.email);
    return ascending ? result : -result;
  }

  if (sort === "last_sign_in_at") {
    return compareNullableDates(a.lastSignInAt, b.lastSignInAt, ascending);
  }

  return compareNullableDates(a.createdAt, b.createdAt, ascending);
}

export async function listAllUsers(admin: SupabaseClient): Promise<User[]> {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (data.users.length < LIST_USERS_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return users;
}

export function mapAdminUser(user: User): AdminUserRow {
  return {
    id: user.id,
    email: user.email ?? "Unknown email",
    providers: getProviders(user),
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

export function getAuthStats(users: User[], now = new Date()): AdminStats {
  const today = getTodayStart(now);
  const last3Days = new Date(now.getTime() - 3 * DAY_MS);
  const last7Days = new Date(now.getTime() - 7 * DAY_MS);
  const last30Days = new Date(now.getTime() - 30 * DAY_MS);

  return {
    totalUsers: users.length,
    newSignups: {
      today: countSince(users, (user) => user.created_at, today),
      last3Days: countSince(users, (user) => user.created_at, last3Days),
      last7Days: countSince(users, (user) => user.created_at, last7Days),
      last30Days: countSince(users, (user) => user.created_at, last30Days),
    },
    activeLogins: {
      today: countSince(users, (user) => user.last_sign_in_at, today),
      last3Days: countSince(users, (user) => user.last_sign_in_at, last3Days),
      last7Days: countSince(users, (user) => user.last_sign_in_at, last7Days),
      last30Days: countSince(users, (user) => user.last_sign_in_at, last30Days),
    },
  };
}

export async function getAdminUsersPage(
  admin: SupabaseClient,
  {
    page,
    perPage,
    sort,
    ascending,
  }: {
    page: number;
    perPage: number;
    sort: AdminUserSort;
    ascending: boolean;
  }
): Promise<AdminUsersResponse> {
  const users = (await listAllUsers(admin))
    .map(mapAdminUser)
    .sort((a, b) => compareUsers(a, b, sort, ascending));
  const total = users.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);
  const start = (normalizedPage - 1) * perPage;

  return {
    users: users.slice(start, start + perPage),
    page: normalizedPage,
    perPage,
    total,
    totalPages,
    sort,
    ascending,
  };
}
