import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  DEFAULT_ANALYSIS_PREFERENCES,
  formatFocusAreasSummary,
} from "./analysis-preferences";
import type { AnalysisPreferences, AnalysisResult } from "./types";

const FOCUS_BULLETS: Record<
  AnalysisPreferences["focusAreas"][number],
  string
> = {
  grammar: "Grammar errors and fixes",
  spelling: "Spelling — misspelled words, typos, and incorrect letter order",
  tone: "Tone (formal, casual, neutral, or mixed)",
  "word-choice": "Word choice — suggest more natural or precise alternatives",
  naturalness: "Naturalness — phrases that sound translated or awkward",
  punctuation: "Punctuation and sentence flow",
};

const analysisSchema = z.object({
  correctedText: z.string(),
  tone: z.enum(["formal", "casual", "neutral", "mixed"]),
  grammarScore: z.number().min(0).max(100),
  summary: z.string(),
  suggestions: z.array(
    z.object({
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

function buildAnalysisPrompt(
  preferences: AnalysisPreferences,
  mode: "paragraph" | "entry"
): string {
  const focusList = preferences.focusAreas
    .map((area, index) => `${index + 1}. ${FOCUS_BULLETS[area]}`)
    .join("\n");

  const cohesionNote =
    mode === "entry" && preferences.focusAreas.length >= 2
      ? "\n6. Flow and cohesion between paragraphs"
      : "";

  const customNote = preferences.customNote
    ? `\n\nThe learner's goal: ${preferences.customNote}`
    : "";

  const scope =
    mode === "entry"
      ? "Review the user's full journal entry (multiple paragraphs)"
      : "Analyze the user's paragraph";

  const suggestionRange =
    mode === "entry" ? "5-12 suggestions spanning the entry" : "3-8 suggestions";
  const minimumSuggestions = mode === "entry" ? 3 : 2;

  return `You are an expert English language coach helping non-native speakers improve their journal writing.

${scope} and return structured feedback focused on:
${focusList}${cohesionNote}

Only provide suggestions in these focus areas: ${formatFocusAreasSummary(preferences.focusAreas)}.
Do not include suggestions outside the selected focus areas.

Be encouraging but precise. Prioritize changes that make the writing sound more natural to native English speakers.

Include ${suggestionRange}. If the text is already excellent, still provide at least ${minimumSuggestions} minor polish suggestions.${customNote}`;
}

function filterSuggestions(
  result: AnalysisResult,
  preferences: AnalysisPreferences
): AnalysisResult {
  const allowed = new Set(preferences.focusAreas);
  return {
    ...result,
    suggestions: result.suggestions.filter((suggestion) =>
      allowed.has(suggestion.category)
    ),
  };
}

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

export async function analyzeText(
  text: string,
  preferences: AnalysisPreferences = DEFAULT_ANALYSIS_PREFERENCES
): Promise<AnalysisResult> {
  if (!isAiConfigured()) {
    throw new Error(
      "AI provider is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file."
    );
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: analysisSchema,
    system: buildAnalysisPrompt(preferences, "paragraph"),
    prompt: `Please analyze this journal paragraph:\n\n${text}`,
    temperature: 0.4,
    experimental_repairText: async ({ text: rawText }) =>
      repairStructuredOutputText(rawText),
  });

  return filterSuggestions(object, preferences);
}

export function getMockAnalysis(
  text: string,
  preferences: AnalysisPreferences = DEFAULT_ANALYSIS_PREFERENCES
): AnalysisResult {
  const focusSummary = formatFocusAreasSummary(preferences.focusAreas);
  const result: AnalysisResult = {
    correctedText: text,
    tone: "neutral",
    grammarScore: 75,
    summary: preferences.customNote
      ? `Demo analysis focused on ${focusSummary}. Goal: ${preferences.customNote}`
      : `Demo analysis focused on ${focusSummary}. Configure GOOGLE_GENERATIVE_AI_API_KEY in .env.local to get real AI feedback on your writing.`,
    suggestions: [
      {
        category: "naturalness",
        original: "your paragraph",
        suggestion: "your polished paragraph",
        explanation:
          "Connect your AI provider API key to receive personalized suggestions for your actual writing.",
      },
      {
        category: "grammar",
        original: "sample phrase",
        suggestion: "polished phrase",
        explanation: "Demo suggestion for grammar-focused feedback.",
      },
      {
        category: "spelling",
        original: "recieve",
        suggestion: "receive",
        explanation: "Demo suggestion for spelling-focused feedback.",
      },
      {
        category: "word-choice",
        original: "common word",
        suggestion: "more precise word",
        explanation: "Demo suggestion for word-choice-focused feedback.",
      },
    ],
  };

  return filterSuggestions(result, preferences);
}

export async function reviewEntry(
  text: string,
  preferences: AnalysisPreferences = DEFAULT_ANALYSIS_PREFERENCES
): Promise<AnalysisResult> {
  if (!isAiConfigured()) {
    throw new Error(
      "AI provider is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file."
    );
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: analysisSchema,
    system: buildAnalysisPrompt(preferences, "entry"),
    prompt: `Please review this full journal entry:\n\n${text}`,
    temperature: 0.4,
    experimental_repairText: async ({ text: rawText }) =>
      repairStructuredOutputText(rawText),
  });

  return filterSuggestions(object, preferences);
}

export function getMockEntryReview(
  text: string,
  preferences: AnalysisPreferences = DEFAULT_ANALYSIS_PREFERENCES
): AnalysisResult {
  const paragraphCount = text.split(/\n\n+/).filter((p) => p.trim()).length;
  const focusSummary = formatFocusAreasSummary(preferences.focusAreas);
  const result: AnalysisResult = {
    correctedText: text,
    tone: "neutral",
    grammarScore: 72,
    summary: `Demo full-entry review across ${paragraphCount || 1} paragraph${paragraphCount === 1 ? "" : "s"}, focused on ${focusSummary}. Configure GOOGLE_GENERATIVE_AI_API_KEY in .env.local for real feedback.`,
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
      {
        category: "grammar",
        original: "sample sentence",
        suggestion: "corrected sentence",
        explanation: "Demo grammar suggestion for the full entry.",
      },
    ],
  };

  return filterSuggestions(result, preferences);
}
