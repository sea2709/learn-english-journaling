import OpenAI from "openai";
import type { AnalysisResult } from "./types";

const SYSTEM_PROMPT = `You are an expert English language coach helping non-native speakers improve their journal writing.

Analyze the user's paragraph and return structured JSON feedback focused on:
1. Grammar errors and fixes
2. Tone (formal, casual, neutral, or mixed)
3. Word choice — suggest more natural or precise alternatives
4. Naturalness — phrases that sound translated or awkward
5. Punctuation and sentence flow

Be encouraging but precise. Prioritize changes that make the writing sound more natural to native English speakers.

Return ONLY valid JSON matching this schema:
{
  "correctedText": "full paragraph with all improvements applied",
  "tone": "formal" | "casual" | "neutral" | "mixed",
  "grammarScore": number from 0-100,
  "summary": "2-3 sentence overall assessment",
  "suggestions": [
    {
      "category": "grammar" | "tone" | "word-choice" | "naturalness" | "punctuation",
      "original": "the exact phrase from the text",
      "suggestion": "the improved version",
      "explanation": "brief, clear explanation"
    }
  ]
}

Include 3-8 suggestions. If the text is already excellent, still provide at least 2 minor polish suggestions.`;

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to your .env.local file."
    );
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Please analyze this journal paragraph:\n\n${text}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content) as AnalysisResult;

  if (
    !parsed.correctedText ||
    !parsed.tone ||
    typeof parsed.grammarScore !== "number" ||
    !Array.isArray(parsed.suggestions)
  ) {
    throw new Error("Invalid AI response format");
  }

  return parsed;
}

export function getMockAnalysis(text: string): AnalysisResult {
  return {
    correctedText: text,
    tone: "neutral",
    grammarScore: 75,
    summary:
      "This is a demo analysis. Configure OPENAI_API_KEY in .env.local to get real AI feedback on your writing.",
    suggestions: [
      {
        category: "naturalness",
        original: "your paragraph",
        suggestion: "your polished paragraph",
        explanation:
          "Connect your OpenAI API key to receive personalized suggestions for your actual writing.",
      },
    ],
  };
}
