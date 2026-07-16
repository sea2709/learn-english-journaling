import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
  DEFAULT_ANALYSIS_PREFERENCES,
  parseAnalysisPreferences,
} from "@/lib/analysis-preferences";
import {
  discussParagraph,
  getMockParagraphReply,
  isAiConfigured,
} from "@/lib/ai";
import {
  MAX_SUGGESTION_DISCUSSION_MESSAGES,
  MAX_SUGGESTION_MESSAGE_LENGTH,
} from "@/lib/suggestion-discussion";

const analysisSchema = z.object({
  correctedText: z.string(),
  tone: z.enum(["formal", "casual", "neutral", "mixed"]),
  grammarScore: z.number().min(0).max(100),
  summary: z.string(),
  suggestions: z.array(
    z.object({
      id: z.string().min(1),
      category: z.enum([
        "grammar",
        "spelling",
        "tone",
        "word-choice",
        "naturalness",
        "punctuation",
      ]),
      original: z.string(),
      suggestion: z.string(),
      explanation: z.string(),
    })
  ),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1)
    .max(MAX_SUGGESTION_MESSAGE_LENGTH, {
      message: `Each message must be under ${MAX_SUGGESTION_MESSAGE_LENGTH} characters.`,
    }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paragraphText =
      typeof body.paragraphText === "string" ? body.paragraphText.trim() : "";

    if (!paragraphText) {
      return NextResponse.json(
        { error: "Paragraph text is required." },
        { status: 400 }
      );
    }

    if (paragraphText.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Paragraph is too long. Please keep it under 5,000 characters.",
        },
        { status: 400 }
      );
    }

    let analysis = null;
    if (body.analysis != null) {
      const analysisResult = analysisSchema.safeParse(body.analysis);
      if (!analysisResult.success) {
        return NextResponse.json(
          { error: "Invalid analysis." },
          { status: 400 }
        );
      }
      analysis = analysisResult.data;
    }

    const messagesResult = z.array(messageSchema).safeParse(body.messages);
    if (!messagesResult.success) {
      const message =
        messagesResult.error.issues[0]?.message ?? "Invalid messages.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const messages = messagesResult.data;
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Ask a question about this paragraph." },
        { status: 400 }
      );
    }

    // messages includes the new user turn; leave room for the assistant reply in storage.
    if (messages.length + 1 > MAX_SUGGESTION_DISCUSSION_MESSAGES) {
      return NextResponse.json(
        {
          error: `This conversation has reached the limit of ${MAX_SUGGESTION_DISCUSSION_MESSAGES} messages.`,
        },
        { status: 400 }
      );
    }

    if (messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json(
        { error: "The last message must be from the learner." },
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
            ? (error.issues[0]?.message ?? "Invalid preferences.")
            : "Invalid preferences.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const useMock = !isAiConfigured();
    const reply = useMock
      ? getMockParagraphReply(paragraphText)
      : await discussParagraph({
          paragraphText,
          analysis,
          messages,
          preferences,
        });

    if (!reply) {
      return NextResponse.json(
        { error: "Received an empty reply. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply, mock: useMock });
  } catch (error) {
    console.error("Paragraph chat error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to answer question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
