import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin-auth";
import { listFeedbackForAdmin } from "@/lib/feedback-db";
import type {
  AdminFeedbackSort,
  AdminFeedbackSortOrder,
  FeedbackStatus,
} from "@/lib/types";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSort(value: string | null): AdminFeedbackSort {
  if (value === "status" || value === "category") {
    return value;
  }
  return "created_at";
}

function parseOrder(value: string | null): AdminFeedbackSortOrder {
  return value === "asc" ? "asc" : "desc";
}

function parseStatus(value: string | null): FeedbackStatus | undefined {
  if (value === "new" || value === "read" || value === "archived") {
    return value;
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const perPage = Math.min(
      parsePositiveInt(searchParams.get("perPage"), 25),
      100
    );
    const sort = parseSort(searchParams.get("sort"));
    const order = parseOrder(searchParams.get("order"));
    const status = parseStatus(searchParams.get("status"));

    const result = await listFeedbackForAdmin({
      page,
      perPage,
      status,
      sort,
      order,
    });

    return NextResponse.json({
      feedback: result.feedback,
      total: result.total,
      page,
      perPage,
      newCount: result.newCount,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Admin feedback list error:", error);
    return NextResponse.json(
      { error: "Failed to load feedback." },
      { status: 500 }
    );
  }
}
