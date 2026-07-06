import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AdminAuthError, requireAdmin } from "@/lib/admin-auth";
import { updateFeedbackForAdmin } from "@/lib/feedback-db";
import { parseAdminFeedbackUpdate } from "@/lib/feedback-schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const patch = parseAdminFeedbackUpdate(body);
    const feedback = await updateFeedbackForAdmin(id, {
      status: patch.status,
      internalNotes: patch.internalNotes,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Invalid feedback update.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Admin feedback update error:", error);
    return NextResponse.json(
      { error: "Failed to update feedback." },
      { status: 500 }
    );
  }
}
