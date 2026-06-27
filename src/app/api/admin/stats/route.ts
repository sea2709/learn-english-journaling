import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthStats } from "@/lib/admin-users";

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const adminClient = createAdminClient();
    const stats = await getAuthStats(adminClient);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to load stats." },
      { status: 500 }
    );
  }
}
