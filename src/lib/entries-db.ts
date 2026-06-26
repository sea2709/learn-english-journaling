import type { SupabaseClient } from "@supabase/supabase-js";
import { toListItem } from "@/lib/entry-utils";
import type {
  AnalysisResult,
  JournalEntryListItem,
  JournalParagraph,
  StoredJournalEntry,
} from "@/lib/types";

const MAX_ENTRIES_PER_USER = 50;

type DbParagraph = {
  id: string;
  entry_id: string;
  order: number;
  text: string;
  analyzed_text: string | null;
  analysis: AnalysisResult | null;
};

type DbEntry = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  status: string;
  journal_paragraphs: DbParagraph[] | null;
};

function mapParagraphFromDb(paragraph: DbParagraph): JournalParagraph {
  return {
    id: paragraph.id,
    text: paragraph.text,
    analyzedText: paragraph.analyzed_text,
    analysis: paragraph.analysis,
  };
}

function mapEntryFromDb(entry: DbEntry): StoredJournalEntry {
  const paragraphs = (entry.journal_paragraphs ?? [])
    .sort((a, b) => a.order - b.order)
    .map(mapParagraphFromDb);

  return {
    id: entry.id,
    title: entry.title,
    date: entry.date,
    status: entry.status,
    paragraphs,
  };
}

function mapParagraphToDb(
  entryId: string,
  paragraph: JournalParagraph,
  order: number
) {
  return {
    id: paragraph.id,
    entry_id: entryId,
    order,
    text: paragraph.text,
    analyzed_text: paragraph.analyzedText,
    analysis: paragraph.analysis,
  };
}

export async function listEntriesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<JournalEntryListItem[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*, journal_paragraphs(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(MAX_ENTRIES_PER_USER);

  if (error) throw error;

  return (data as DbEntry[]).map((entry) => toListItem(mapEntryFromDb(entry)));
}

export async function getEntryForUser(
  supabase: SupabaseClient,
  userId: string,
  entryId: string
): Promise<StoredJournalEntry | null> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*, journal_paragraphs(*)")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapEntryFromDb(data as DbEntry);
}

export async function upsertEntryForUser(
  supabase: SupabaseClient,
  userId: string,
  entry: StoredJournalEntry
): Promise<StoredJournalEntry> {
  const { data: existing, error: existingError } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("id", entry.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({
        title: entry.title,
        date: entry.date,
        status: entry.status,
      })
      .eq("id", entry.id)
      .eq("user_id", userId);

    if (updateError) throw updateError;

    const paragraphIds = entry.paragraphs.map((paragraph) => paragraph.id);

    if (paragraphIds.length === 0) {
      const { error: deleteAllError } = await supabase
        .from("journal_paragraphs")
        .delete()
        .eq("entry_id", entry.id);

      if (deleteAllError) throw deleteAllError;
    } else {
      const { error: deleteError } = await supabase
        .from("journal_paragraphs")
        .delete()
        .eq("entry_id", entry.id)
        .not("id", "in", `(${paragraphIds.join(",")})`);

      if (deleteError) throw deleteError;
    }

    if (entry.paragraphs.length > 0) {
      const { error: upsertParagraphsError } = await supabase
        .from("journal_paragraphs")
        .upsert(
          entry.paragraphs.map((paragraph, index) =>
            mapParagraphToDb(entry.id, paragraph, index)
          ),
          { onConflict: "id" }
        );

      if (upsertParagraphsError) throw upsertParagraphsError;
    }
  } else {
    const { count, error: countError } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw countError;

    if ((count ?? 0) >= MAX_ENTRIES_PER_USER) {
      const { data: oldest, error: oldestError } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (oldestError) throw oldestError;

      if (oldest) {
        const { error: deleteOldestError } = await supabase
          .from("journal_entries")
          .delete()
          .eq("id", oldest.id);

        if (deleteOldestError) throw deleteOldestError;
      }
    }

    const { error: insertError } = await supabase.from("journal_entries").insert({
      id: entry.id,
      user_id: userId,
      title: entry.title,
      date: entry.date,
      status: entry.status,
    });

    if (insertError) throw insertError;

    if (entry.paragraphs.length > 0) {
      const { error: insertParagraphsError } = await supabase
        .from("journal_paragraphs")
        .insert(
          entry.paragraphs.map((paragraph, index) =>
            mapParagraphToDb(entry.id, paragraph, index)
          )
        );

      if (insertParagraphsError) throw insertParagraphsError;
    }
  }

  const saved = await getEntryForUser(supabase, userId, entry.id);
  if (!saved) {
    throw new Error("Failed to save entry.");
  }

  return saved;
}

export async function deleteEntryForUser(
  supabase: SupabaseClient,
  userId: string,
  entryId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
