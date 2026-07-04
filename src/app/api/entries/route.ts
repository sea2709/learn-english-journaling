import { NextRequest, NextResponse } from "next/server";
import {
  listEntriesForUser,
  upsertEntryForUser,
} from "@/lib/entries-db";
import { createClient } from "@/lib/supabase/server";
import type { EntryBlock, StoredJournalEntry } from "@/lib/types";

function isEntryBlock(value: unknown): value is EntryBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as EntryBlock;

  if (block.type === "text") {
    return (
      typeof block.id === "string" &&
      typeof block.text === "string" &&
      (block.analyzedText === null || typeof block.analyzedText === "string")
    );
  }

  if (block.type === "image") {
    return typeof block.id === "string" && typeof block.path === "string";
  }

  return false;
}

function isStoredEntry(value: unknown): value is StoredJournalEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as StoredJournalEntry;
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.date === "string" &&
    typeof entry.status === "string" &&
    Array.isArray(entry.blocks) &&
    entry.blocks.every(isEntryBlock)
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entries = await listEntriesForUser(supabase, user.id);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("List entries error:", error);
    return NextResponse.json(
      { error: "Failed to load entries." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!isStoredEntry(body)) {
      return NextResponse.json(
        { error: "Invalid entry payload." },
        { status: 400 }
      );
    }

    const hasText = body.blocks.some(
      (block) => block.type === "text" && block.text.trim()
    );
    if (!hasText) {
      return NextResponse.json(
        { error: "Entry must include at least one paragraph with text." },
        { status: 400 }
      );
    }

    const entry = await upsertEntryForUser(supabase, user.id, body);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Save entry error:", error);
    return NextResponse.json(
      { error: "Failed to save entry." },
      { status: 500 }
    );
  }
}
