import { NextRequest, NextResponse } from "next/server";
import { analyzeText, getMockAnalysis } from "@/lib/ai";

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

    const useMock = !process.env.OPENAI_API_KEY;
    const analysis = useMock
      ? getMockAnalysis(text)
      : await analyzeText(text);

    return NextResponse.json({ analysis, mock: useMock });
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
