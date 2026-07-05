import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_ANALYSIS_PREFERENCES,
  parseAnalysisPreferences,
} from "@/lib/analysis-preferences";
import type { AnalysisPreferences } from "@/lib/types";

type DbUserPreferences = {
  user_id: string;
  analysis_preferences: unknown;
};

function mapPreferences(row: DbUserPreferences): AnalysisPreferences {
  try {
    return parseAnalysisPreferences(row.analysis_preferences);
  } catch {
    return DEFAULT_ANALYSIS_PREFERENCES;
  }
}

export async function getPreferencesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalysisPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("user_id, analysis_preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("user_preferences")
      .insert({
        user_id: userId,
        analysis_preferences: DEFAULT_ANALYSIS_PREFERENCES,
      })
      .select("user_id, analysis_preferences")
      .single();

    if (insertError) {
      throw insertError;
    }

    return mapPreferences(inserted);
  }

  return mapPreferences(data);
}

export async function upsertPreferencesForUser(
  supabase: SupabaseClient,
  userId: string,
  preferences: AnalysisPreferences
): Promise<AnalysisPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        analysis_preferences: preferences,
      },
      { onConflict: "user_id" }
    )
    .select("user_id, analysis_preferences")
    .single();

  if (error) {
    throw error;
  }

  return mapPreferences(data);
}
