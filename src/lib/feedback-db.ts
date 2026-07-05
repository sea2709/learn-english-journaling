import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminFeedbackRow,
  AdminFeedbackSort,
  AdminFeedbackSortOrder,
  FeedbackStatus,
  UserFeedbackSubmission,
} from "@/lib/types";

type DbUserFeedback = {
  id: string;
  user_id: string;
  user_email: string;
  category: AdminFeedbackRow["category"];
  message: string;
  contact_note: string | null;
  status: FeedbackStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapFeedbackFromDb(row: DbUserFeedback): AdminFeedbackRow {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    category: row.category,
    message: row.message,
    contactNote: row.contact_note,
    status: row.status,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertFeedbackForUser(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  payload: UserFeedbackSubmission
): Promise<void> {
  const { error } = await supabase.from("user_feedback").insert({
    user_id: userId,
    user_email: userEmail,
    category: payload.category,
    message: payload.message,
    contact_note: payload.contactNote ?? null,
    status: "new",
  });

  if (error) {
    throw error;
  }
}

export async function countNewFeedback(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("user_feedback")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listFeedbackForAdmin(options: {
  page: number;
  perPage: number;
  status?: FeedbackStatus;
  sort: AdminFeedbackSort;
  order: AdminFeedbackSortOrder;
}): Promise<{
  feedback: AdminFeedbackRow[];
  total: number;
  newCount: number;
}> {
  const supabase = createAdminClient();
  const { page, perPage, status, sort, order } = options;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from("user_feedback").select("*", { count: "exact" });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order(sort, { ascending: order === "asc" })
    .range(from, to);

  if (error) {
    throw error;
  }

  const newCount = await countNewFeedback();

  return {
    feedback: (data ?? []).map((row) => mapFeedbackFromDb(row as DbUserFeedback)),
    total: count ?? 0,
    newCount,
  };
}

export async function updateFeedbackForAdmin(
  id: string,
  patch: { status?: FeedbackStatus; internalNotes?: string | null }
): Promise<AdminFeedbackRow> {
  const supabase = createAdminClient();
  const updates: Partial<DbUserFeedback> = {};

  if (patch.status !== undefined) {
    updates.status = patch.status;
  }

  if (patch.internalNotes !== undefined) {
    updates.internal_notes = patch.internalNotes;
  }

  const { data, error } = await supabase
    .from("user_feedback")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapFeedbackFromDb(data as DbUserFeedback);
}
