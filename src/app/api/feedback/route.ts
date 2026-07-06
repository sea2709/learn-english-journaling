import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseFeedbackSubmission } from "@/lib/feedback-schema";
import { insertFeedbackForUser } from "@/lib/feedback-db";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "Account email is required to send feedback." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const payload = parseFeedbackSubmission(body);
    await insertFeedbackForUser(supabase, user.id, user.email, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Invalid feedback.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Submit feedback error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback." },
      { status: 500 }
    );
  }
}
