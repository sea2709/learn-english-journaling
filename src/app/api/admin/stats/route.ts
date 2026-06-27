import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAuthStats, listAllUsers } from "@/lib/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  try {
    const admin = createAdminClient();
    const users = await listAllUsers(admin);
    return NextResponse.json({ stats: getAuthStats(users) });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to load admin stats." },
      { status: 500 }
    );
  }
}
