import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminStats,
  AdminUserRow,
  AdminUsersResponse,
  AdminUserSort,
  AdminUserSortOrder,
} from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function countSince(
  users: User[],
  getDate: (user: User) => string | undefined | null,
  days: number
): number {
  const cutoff = Date.now() - days * MS_PER_DAY;
  return users.filter((user) => {
    const value = getDate(user);
    return value ? new Date(value).getTime() >= cutoff : false;
  }).length;
}

export function mapAdminUser(user: User): AdminUserRow {
  const providers = [
    ...new Set((user.identities ?? []).map((identity) => identity.provider)),
  ];

  return {
    id: user.id,
    email: user.email ?? "(no email)",
    providers: providers.length > 0 ? providers : ["email"],
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

async function fetchAllAuthUsers(): Promise<User[]> {
  const admin = createAdminClient();
  const users: User[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

export async function getAuthStats(): Promise<AdminStats> {
  const users = await fetchAllAuthUsers();

  return {
    totalUsers: users.length,
    signupsToday: countSince(users, (user) => user.created_at, 1),
    signupsLast3Days: countSince(users, (user) => user.created_at, 3),
    signupsLast7Days: countSince(users, (user) => user.created_at, 7),
    signupsLast30Days: countSince(users, (user) => user.created_at, 30),
    activeToday: countSince(users, (user) => user.last_sign_in_at, 1),
    activeLast3Days: countSince(users, (user) => user.last_sign_in_at, 3),
    activeLast7Days: countSince(users, (user) => user.last_sign_in_at, 7),
    activeLast30Days: countSince(users, (user) => user.last_sign_in_at, 30),
  };
}

export async function listAllUsers(options: {
  page?: number;
  perPage?: number;
  sort?: AdminUserSort;
  order?: AdminUserSortOrder;
}): Promise<AdminUsersResponse> {
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(100, Math.max(1, options.perPage ?? 25));
  const sort = options.sort ?? "created_at";
  const order = options.order ?? "desc";

  const users = (await fetchAllAuthUsers()).map(mapAdminUser);

  users.sort((left, right) => {
    let comparison = 0;

    if (sort === "email") {
      comparison = left.email.localeCompare(right.email);
    } else if (sort === "last_sign_in_at") {
      const leftTime = left.lastSignInAt
        ? new Date(left.lastSignInAt).getTime()
        : 0;
      const rightTime = right.lastSignInAt
        ? new Date(right.lastSignInAt).getTime()
        : 0;
      comparison = leftTime - rightTime;
    } else {
      comparison =
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }

    return order === "asc" ? comparison : -comparison;
  });

  const total = users.length;
  const start = (page - 1) * perPage;

  return {
    users: users.slice(start, start + perPage),
    total,
    page,
    perPage,
  };
}
