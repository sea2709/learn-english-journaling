import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin-auth";
import { getAuthStats } from "@/lib/admin-users";

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAuthStats();
    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to load admin stats." },
      { status: 500 }
    );
  }
}
