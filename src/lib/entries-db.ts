import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteEntryImagesForEntry } from "@/lib/entry-images";
import { toListItem } from "@/lib/entry-utils";
import type {
  AnalysisResult,
  EntryBlock,
  JournalEntryListItem,
  StoredJournalEntry,
  SuggestionMessage,
} from "@/lib/types";

const MAX_ENTRIES_PER_USER = 50;

type DbParagraph = {
  id: string;
  entry_id: string;
  order: number;
  text: string;
  analyzed_text: string | null;
  analysis: AnalysisResult | null;
  discussion: SuggestionMessage[] | null;
  block_type: "text" | "image" | null;
  image_path: string | null;
};

type DbEntry = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  status: string;
  journal_paragraphs: DbParagraph[] | null;
};

function mapBlockFromDb(paragraph: DbParagraph): EntryBlock {
  if (paragraph.block_type === "image" && paragraph.image_path) {
    return {
      type: "image",
      id: paragraph.id,
      path: paragraph.image_path,
    };
  }

  return {
    type: "text",
    id: paragraph.id,
    text: paragraph.text,
    analyzedText: paragraph.analyzed_text,
    analysis: ensureSuggestionIds(paragraph.analysis),
    discussion: paragraph.discussion ?? undefined,
  };
}

/** Backfill ids for analysis loaded from older rows that predate suggestion ids. */
function ensureSuggestionIds(
  analysis: AnalysisResult | null
): AnalysisResult | null {
  if (!analysis) return null;

  return {
    ...analysis,
    suggestions: analysis.suggestions.map((suggestion) => ({
      ...suggestion,
      id: suggestion.id || crypto.randomUUID(),
    })),
  };
}

function mapEntryFromDb(entry: DbEntry): StoredJournalEntry {
  const blocks = (entry.journal_paragraphs ?? [])
    .sort((a, b) => a.order - b.order)
    .map(mapBlockFromDb);

  return {
    id: entry.id,
    title: entry.title,
    date: entry.date,
    status: entry.status,
    blocks,
  };
}

function mapBlockToDb(entryId: string, block: EntryBlock, order: number) {
  if (block.type === "image") {
    return {
      id: block.id,
      entry_id: entryId,
      order,
      text: "",
      analyzed_text: null,
      analysis: null,
      discussion: null,
      block_type: "image" as const,
      image_path: block.path,
    };
  }

  return {
    id: block.id,
    entry_id: entryId,
    order,
    text: block.text,
    analyzed_text: block.analyzedText,
    analysis: block.analysis,
    discussion: block.discussion ?? null,
    block_type: "text" as const,
    image_path: null,
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

    const blockIds = entry.blocks.map((block) => block.id);

    if (blockIds.length === 0) {
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
        .not("id", "in", `(${blockIds.join(",")})`);

      if (deleteError) throw deleteError;
    }

    if (entry.blocks.length > 0) {
      const { error: upsertBlocksError } = await supabase
        .from("journal_paragraphs")
        .upsert(
          entry.blocks.map((block, index) =>
            mapBlockToDb(entry.id, block, index)
          ),
          { onConflict: "id" }
        );

      if (upsertBlocksError) throw upsertBlocksError;
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
        await deleteEntryImagesForEntry(supabase, userId, oldest.id);

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

    if (entry.blocks.length > 0) {
      const { error: insertBlocksError } = await supabase
        .from("journal_paragraphs")
        .insert(
          entry.blocks.map((block, index) =>
            mapBlockToDb(entry.id, block, index)
          )
        );

      if (insertBlocksError) throw insertBlocksError;
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
  await deleteEntryImagesForEntry(supabase, userId, entryId);

  const { data, error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
