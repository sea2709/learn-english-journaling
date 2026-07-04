import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { AnalysisResult } from "./types";

const SYSTEM_PROMPT = `You are an expert English language coach helping non-native speakers improve their journal writing.

Analyze the user's paragraph and return structured feedback focused on:
1. Grammar errors and fixes
2. Tone (formal, casual, neutral, or mixed)
3. Word choice — suggest more natural or precise alternatives
4. Naturalness — phrases that sound translated or awkward
5. Punctuation and sentence flow

Be encouraging but precise. Prioritize changes that make the writing sound more natural to native English speakers.

Include 3-8 suggestions. If the text is already excellent, still provide at least 2 minor polish suggestions.`;

const analysisSchema = z.object({
  correctedText: z.string(),
  tone: z.enum(["formal", "casual", "neutral", "mixed"]),
  grammarScore: z.number().min(0).max(100),
  summary: z.string(),
  suggestions: z.array(
    z.object({
      category: z.enum([
        "grammar",
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

/** Strip markdown fences and trailing junk after a complete JSON object. */
function extractFirstJsonValue(text: string): string | null {
  const trimmed = text.trim();
  const start = trimmed.search(/[\[{]/);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (inString) {
      if (escape) escape = false;
      else if (char === "\\") escape = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") {
      depth--;
      if (depth === 0) {
        const candidate = trimmed.slice(start, i + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function repairStructuredOutputText(text: string): string | null {
  const withoutFences = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```[\s\S]*$/, "")
    .trim();

  for (const candidate of [withoutFences, text.trim()]) {
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      const extracted = extractFirstJsonValue(candidate);
      if (extracted) return extracted;
    }
  }
  return null;
}

function getModel() {
  const provider = process.env.AI_PROVIDER ?? "google";
  const model = process.env.AI_MODEL ?? "gemini-2.0-flash";

  switch (provider) {
    case "openai":
      return openai(model);
    case "google":
    default:
      return google(model);
  }
}

export function isAiConfigured(): boolean {
  const provider = process.env.AI_PROVIDER ?? "google";
  switch (provider) {
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY);
    case "google":
    default:
      return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  if (!isAiConfigured()) {
    throw new Error(
      "AI provider is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file."
    );
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: analysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `Please analyze this journal paragraph:\n\n${text}`,
    temperature: 0.4,
    experimental_repairText: async ({ text: rawText }) =>
      repairStructuredOutputText(rawText),
  });

  return object;
}

export function getMockAnalysis(text: string): AnalysisResult {
  return {
    correctedText: text,
    tone: "neutral",
    grammarScore: 75,
    summary:
      "This is a demo analysis. Configure GOOGLE_GENERATIVE_AI_API_KEY in .env.local to get real AI feedback on your writing.",
    suggestions: [
      {
        category: "naturalness",
        original: "your paragraph",
        suggestion: "your polished paragraph",
        explanation:
          "Connect your AI provider API key to receive personalized suggestions for your actual writing.",
      },
    ],
  };
}

const REVIEW_SYSTEM_PROMPT = `You are an expert English language coach helping non-native speakers improve their journal writing.

Review the user's full journal entry (multiple paragraphs) and return structured feedback focused on:
1. Overall grammar and clarity across the entire entry
2. Tone consistency (formal, casual, neutral, or mixed)
3. Word choice — suggest more natural or precise alternatives
4. Naturalness — phrases that sound translated or awkward
5. Flow and cohesion between paragraphs

Be encouraging but precise. Prioritize changes that make the writing sound more natural to native English speakers.

Include 5-12 suggestions spanning the entry. If the text is already excellent, still provide at least 3 minor polish suggestions.`;

export async function reviewEntry(text: string): Promise<AnalysisResult> {
  if (!isAiConfigured()) {
    throw new Error(
      "AI provider is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file."
    );
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: analysisSchema,
    system: REVIEW_SYSTEM_PROMPT,
    prompt: `Please review this full journal entry:\n\n${text}`,
    temperature: 0.4,
    experimental_repairText: async ({ text: rawText }) =>
      repairStructuredOutputText(rawText),
  });

  return object;
}

export function getMockEntryReview(text: string): AnalysisResult {
  const paragraphCount = text.split(/\n\n+/).filter((p) => p.trim()).length;
  return {
    correctedText: text,
    tone: "neutral",
    grammarScore: 72,
    summary: `Demo full-entry review across ${paragraphCount || 1} paragraph${paragraphCount === 1 ? "" : "s"}. Configure GOOGLE_GENERATIVE_AI_API_KEY in .env.local for real feedback.`,
    suggestions: [
      {
        category: "naturalness",
        original: "your entry",
        suggestion: "your polished entry",
        explanation:
          "Connect your AI provider API key to receive personalized suggestions for your full journal entry.",
      },
      {
        category: "tone",
        original: "overall tone",
        suggestion: "consistent tone",
        explanation:
          "A full-entry review checks tone consistency across all paragraphs.",
      },
    ],
  };
}
