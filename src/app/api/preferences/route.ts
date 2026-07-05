import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseAnalysisPreferences } from "@/lib/analysis-preferences";
import {
  getPreferencesForUser,
  upsertPreferencesForUser,
} from "@/lib/preferences-db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const preferences = await getPreferencesForUser(supabase, user.id);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to load preferences." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const preferences = parseAnalysisPreferences(body);
    const saved = await upsertPreferencesForUser(supabase, user.id, preferences);
    return NextResponse.json({ preferences: saved });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Invalid preferences.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Save preferences error:", error);
    return NextResponse.json(
      { error: "Failed to save preferences." },
      { status: 500 }
    );
  }
}
