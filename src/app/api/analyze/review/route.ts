import { NextRequest, NextResponse } from "next/server";
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

    const useMock = !isAiConfigured();
    const review = useMock ? getMockEntryReview(text) : await reviewEntry(text);

    return NextResponse.json({ review, mock: useMock });
  } catch (error) {
    console.error("Entry review error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to review entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
