import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteAllImagesForUser } from "@/lib/entry-images";
import { createAdminClient } from "@/lib/supabase/admin";

export type DataDeletionStatus = "pending" | "completed" | "failed";

export type DataDeletionRequest = {
  id: string;
  confirmationCode: string;
  facebookUserId: string;
  supabaseUserId: string | null;
  status: DataDeletionStatus;
  message: string;
  createdAt: string;
  completedAt: string | null;
};

type DataDeletionRow = {
  id: string;
  confirmation_code: string;
  facebook_user_id: string;
  supabase_user_id: string | null;
  status: DataDeletionStatus;
  message: string;
  created_at: string;
  completed_at: string | null;
};

function mapRow(row: DataDeletionRow): DataDeletionRequest {
  return {
    id: row.id,
    confirmationCode: row.confirmation_code,
    facebookUserId: row.facebook_user_id,
    supabaseUserId: row.supabase_user_id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function newConfirmationCode(): string {
  return randomBytes(8).toString("hex");
}

async function findUserIdByIdentity(
  admin: SupabaseClient,
  provider: string,
  providerId: string
): Promise<string | null> {
  const { data, error } = await admin.rpc("find_user_id_by_identity", {
    p_provider: provider,
    p_provider_id: providerId,
  });

  if (error) {
    throw error;
  }

  return typeof data === "string" ? data : null;
}

async function insertRequest(
  admin: SupabaseClient,
  input: {
    confirmationCode: string;
    facebookUserId: string;
    supabaseUserId: string | null;
    status: DataDeletionStatus;
    message: string;
    completedAt: string | null;
  }
): Promise<DataDeletionRequest> {
  const { data, error } = await admin
    .from("data_deletion_requests")
    .insert({
      confirmation_code: input.confirmationCode,
      facebook_user_id: input.facebookUserId,
      supabase_user_id: input.supabaseUserId,
      status: input.status,
      message: input.message,
      completed_at: input.completedAt,
    })
    .select(
      "id, confirmation_code, facebook_user_id, supabase_user_id, status, message, created_at, completed_at"
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to record deletion request.");
  }

  return mapRow(data as DataDeletionRow);
}

async function markRequest(
  admin: SupabaseClient,
  confirmationCode: string,
  update: {
    status: DataDeletionStatus;
    message: string;
    supabaseUserId?: string | null;
  }
): Promise<void> {
  const { error } = await admin
    .from("data_deletion_requests")
    .update({
      status: update.status,
      message: update.message,
      completed_at: new Date().toISOString(),
      ...(update.supabaseUserId !== undefined
        ? { supabase_user_id: update.supabaseUserId }
        : {}),
    })
    .eq("confirmation_code", confirmationCode);

  if (error) {
    throw error;
  }
}

/**
 * Process a Meta data-deletion callback for a Facebook app-scoped user id.
 * Always creates a confirmation code; deletes the matching account when found.
 */
export async function processFacebookDataDeletion(
  facebookUserId: string
): Promise<{ confirmationCode: string }> {
  const admin = createAdminClient();
  const confirmationCode = newConfirmationCode();

  const pending = await insertRequest(admin, {
    confirmationCode,
    facebookUserId,
    supabaseUserId: null,
    status: "pending",
    message: "Your data deletion request has been received and is being processed.",
    completedAt: null,
  });

  try {
    const supabaseUserId = await findUserIdByIdentity(
      admin,
      "facebook",
      facebookUserId
    );

    if (!supabaseUserId) {
      await markRequest(admin, pending.confirmationCode, {
        status: "completed",
        message:
          "No English Journal account was found for this Facebook user. No personal data was stored, or it was already removed.",
        supabaseUserId: null,
      });
      return { confirmationCode: pending.confirmationCode };
    }

    await deleteAllImagesForUser(admin, supabaseUserId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(
      supabaseUserId
    );

    if (deleteError) {
      throw deleteError;
    }

    await markRequest(admin, pending.confirmationCode, {
      status: "completed",
      message:
        "Your English Journal account and associated data (journal entries, preferences, feedback, and entry images) have been deleted.",
      supabaseUserId,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    await markRequest(admin, pending.confirmationCode, {
      status: "failed",
      message: `We could not complete your deletion request automatically (${detail}). Please contact us through the in-app Send feedback feature or try again later.`,
    });
  }

  return { confirmationCode: pending.confirmationCode };
}

export async function getDataDeletionRequestByCode(
  confirmationCode: string
): Promise<DataDeletionRequest | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("data_deletion_requests")
    .select(
      "id, confirmation_code, facebook_user_id, supabase_user_id, status, message, created_at, completed_at"
    )
    .eq("confirmation_code", confirmationCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapRow(data as DataDeletionRow);
}
