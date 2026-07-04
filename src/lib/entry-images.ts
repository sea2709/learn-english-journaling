import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export const ENTRY_IMAGES_BUCKET = "entry-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Use a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  return null;
}

export function buildImagePath(
  userId: string,
  entryId: string,
  imageId: string,
  mimeType: string
): string {
  const ext = EXT_BY_MIME[mimeType] ?? "jpg";
  return `${userId}/${entryId}/${imageId}.${ext}`;
}

export async function uploadEntryImage(
  userId: string,
  entryId: string,
  file: File
): Promise<{ id: string; path: string }> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const id = crypto.randomUUID();
  const path = buildImagePath(userId, entryId, id, file.type);
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(ENTRY_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message || "Failed to upload image.");
  }

  return { id, path };
}

export async function getSignedImageUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(ENTRY_IMAGES_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Failed to load image.");
  }

  return data.signedUrl;
}

export async function deleteEntryImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(ENTRY_IMAGES_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(error.message || "Failed to delete image.");
  }
}

export async function deleteEntryImagesForEntry(
  supabase: SupabaseClient,
  userId: string,
  entryId: string
): Promise<void> {
  const prefix = `${userId}/${entryId}`;
  const { data: files, error: listError } = await supabase.storage
    .from(ENTRY_IMAGES_BUCKET)
    .list(prefix);

  if (listError) {
    throw listError;
  }

  if (!files || files.length === 0) return;

  const paths = files.map((file) => `${prefix}/${file.name}`);
  const { error: removeError } = await supabase.storage
    .from(ENTRY_IMAGES_BUCKET)
    .remove(paths);

  if (removeError) {
    throw removeError;
  }
}
