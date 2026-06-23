import { NextRequest, NextResponse } from "next/server";
import { listEntries, saveEntry } from "@/lib/notion";
import type { AnalysisResult } from "@/lib/types";

export async function GET() {
  try {
    const entries = await listEntries();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("List entries error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load entries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const originalText =
      typeof body.originalText === "string" ? body.originalText.trim() : "";
    const analysis = body.analysis as AnalysisResult | undefined;

    if (!originalText) {
      return NextResponse.json(
        { error: "Original text is required." },
        { status: 400 }
      );
    }

    if (!analysis?.correctedText) {
      return NextResponse.json(
        { error: "Analysis is required before saving." },
        { status: 400 }
      );
    }

    const entry = await saveEntry(title, originalText, analysis);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Save entry error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
