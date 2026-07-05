import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  DEFAULT_ANALYSIS_PREFERENCES,
  parseAnalysisPreferences,
} from "@/lib/analysis-preferences";
import { analyzeText, getMockAnalysis, isAiConfigured } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Please write a paragraph to analyze." },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Paragraph is too long. Please keep it under 5,000 characters." },
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
    const analysis = useMock
      ? getMockAnalysis(text, preferences)
      : await analyzeText(text, preferences);

    return NextResponse.json({ analysis, mock: useMock });
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
