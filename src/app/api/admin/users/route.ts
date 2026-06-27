import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllUsers } from "@/lib/admin-users";

const VALID_SORT_FIELDS = ["created_at", "last_sign_in_at", "email"] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

function isSortField(v: unknown): v is SortField {
  return VALID_SORT_FIELDS.includes(v as SortField);
}

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20)
  );
  const sortByParam = searchParams.get("sortBy") ?? "created_at";
  const sortBy: SortField = isSortField(sortByParam)
    ? sortByParam
    : "created_at";
  const sortOrder =
    searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  try {
    const adminClient = createAdminClient();
    const result = await listAllUsers(adminClient, {
      page,
      pageSize,
      sortBy,
      sortOrder,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to load users." },
      { status: 500 }
    );
  }
}
