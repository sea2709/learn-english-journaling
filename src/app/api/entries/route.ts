import { NextRequest, NextResponse } from "next/server";
import {
  listEntriesForUser,
  upsertEntryForUser,
} from "@/lib/entries-db";
import { createClient } from "@/lib/supabase/server";
import type { JournalParagraph, StoredJournalEntry } from "@/lib/types";

function isParagraph(value: unknown): value is JournalParagraph {
  if (!value || typeof value !== "object") return false;
  const paragraph = value as JournalParagraph;
  return (
    typeof paragraph.id === "string" &&
    typeof paragraph.text === "string" &&
    (paragraph.analyzedText === null ||
      typeof paragraph.analyzedText === "string")
  );
}

function isStoredEntry(value: unknown): value is StoredJournalEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as StoredJournalEntry;
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.date === "string" &&
    typeof entry.status === "string" &&
    Array.isArray(entry.paragraphs) &&
    entry.paragraphs.every(isParagraph)
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

    if (!body.paragraphs.some((paragraph) => paragraph.text.trim())) {
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
