import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminUsersPage } from "@/lib/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUserSort } from "@/lib/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;
const SORTS: AdminUserSort[] = ["created_at", "last_sign_in_at", "email"];

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSort(value: string | null): AdminUserSort {
  if (SORTS.includes(value as AdminUserSort)) {
    return value as AdminUserSort;
  }

  return "created_at";
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const perPage = Math.min(
    parsePositiveInt(searchParams.get("perPage"), DEFAULT_PER_PAGE),
    MAX_PER_PAGE
  );
  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const sort = parseSort(searchParams.get("sort"));
  const ascending = searchParams.get("ascending") === "true";

  try {
    const admin = createAdminClient();
    const users = await getAdminUsersPage(admin, {
      page,
      perPage,
      sort,
      ascending,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to load admin users." },
      { status: 500 }
    );
  }
}
