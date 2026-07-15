import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
  DEFAULT_ANALYSIS_PREFERENCES,
  parseAnalysisPreferences,
} from "@/lib/analysis-preferences";
import {
  discussSuggestion,
  getMockSuggestionReply,
  isAiConfigured,
} from "@/lib/ai";
import {
  MAX_SUGGESTION_DISCUSSION_MESSAGES,
  MAX_SUGGESTION_MESSAGE_LENGTH,
} from "@/lib/suggestion-discussion";

const suggestionSchema = z.object({
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

    const suggestionResult = suggestionSchema.safeParse(body.suggestion);
    if (!suggestionResult.success) {
      return NextResponse.json(
        { error: "Invalid suggestion." },
        { status: 400 }
      );
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
        { error: "Ask a question about this suggestion." },
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

    const suggestion = suggestionResult.data;
    const useMock = !isAiConfigured();
    const reply = useMock
      ? getMockSuggestionReply(suggestion)
      : await discussSuggestion({
          paragraphText,
          suggestion,
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
    console.error("Suggestion chat error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to answer question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
