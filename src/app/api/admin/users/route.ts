import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin-auth";
import {
  listAllUsers,
} from "@/lib/admin-users";
import type { AdminUserSort, AdminUserSortOrder } from "@/lib/types";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSort(value: string | null): AdminUserSort {
  if (value === "last_sign_in_at" || value === "email") {
    return value;
  }
  return "created_at";
}

function parseOrder(value: string | null): AdminUserSortOrder {
  return value === "asc" ? "asc" : "desc";
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const perPage = parsePositiveInt(searchParams.get("perPage"), 25);
    const sort = parseSort(searchParams.get("sort"));
    const order = parseOrder(searchParams.get("order"));

    const result = await listAllUsers({ page, perPage, sort, order });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to load admin users." },
      { status: 500 }
    );
  }
}
