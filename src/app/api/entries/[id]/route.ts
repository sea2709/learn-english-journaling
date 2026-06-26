import { NextRequest, NextResponse } from "next/server";
import { deleteEntryForUser, getEntryForUser } from "@/lib/entries-db";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const entry = await getEntryForUser(supabase, user.id, id);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Get entry error:", error);
    return NextResponse.json(
      { error: "Failed to load entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteEntryForUser(supabase, user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete entry error:", error);
    return NextResponse.json(
      { error: "Failed to delete entry." },
      { status: 500 }
    );
  }
}
