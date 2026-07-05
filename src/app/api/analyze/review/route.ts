import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  DEFAULT_ANALYSIS_PREFERENCES,
  parseAnalysisPreferences,
} from "@/lib/analysis-preferences";
import {
  getMockEntryReview,
  isAiConfigured,
  reviewEntry,
} from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Please write something before requesting a review." },
        { status: 400 }
      );
    }

    if (text.length > 20000) {
      return NextResponse.json(
        { error: "Entry is too long. Please keep it under 20,000 characters." },
        { status: 400 }
      );
    }

    let preferences = DEFAULT_ANALYSIS_PREFERENCES;
    if (body.preferences !== undefined) {
      try {
        preferences = parseAnalysisPreferences(body.preferences);
      } catch (error) {
        const message =
          error instanceof ZodError
            ? error.issues[0]?.message ?? "Invalid preferences."
            : "Invalid preferences.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const useMock = !isAiConfigured();
    const review = useMock
      ? getMockEntryReview(text, preferences)
      : await reviewEntry(text, preferences);

    return NextResponse.json({ review, mock: useMock });
  } catch (error) {
    console.error("Entry review error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to review entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
