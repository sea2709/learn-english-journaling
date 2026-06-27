import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Returns the list of admin emails from the ADMIN_EMAILS env var.
 * Trims whitespace and filters empty strings.
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Verifies the current session belongs to an admin email.
 * Returns the user if authorized, or a NextResponse with 401/403 to return early.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email: string }; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!isAdminEmail(user.email)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { user: { id: user.id, email: user.email }, errorResponse: null };
}
