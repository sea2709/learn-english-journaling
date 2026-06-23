import type { AnalysisResult, JournalEntry } from "./types";

export const SAMPLE_PARAGRAPH = `Today I go to the coffee shop near my apartment and I was thinking about my English learning journey. I feel little bit nervous when I speak with native speakers because I worry about make grammar mistakes. But I think writing journal every day help me to improve my expression and build more confidence.`;

export const SAMPLE_TITLE = "Coffee shop thoughts";

export const SAMPLE_ANALYSIS: AnalysisResult = {
  correctedText:
    "Today I went to the coffee shop near my apartment and thought about my English learning journey. I feel a little nervous when I speak with native speakers because I worry about making grammar mistakes. But I think writing in a journal every day helps me improve my expression and build more confidence.",
  tone: "casual",
  grammarScore: 72,
  summary:
    "Your writing clearly conveys your thoughts and feelings. The main issues are verb tenses, article usage, and a few phrases that sound translated rather than natural. With small fixes, this would read like a confident journal entry.",
  suggestions: [
    {
      category: "grammar",
      original: "Today I go to the coffee shop",
      suggestion: "Today I went to the coffee shop",
      explanation:
        "Use past tense for events that already happened today. \"Go\" describes a habit; \"went\" fits a specific moment.",
    },
    {
      category: "grammar",
      original: "worry about make grammar mistakes",
      suggestion: "worry about making grammar mistakes",
      explanation:
        "After \"worry about,\" use the -ing form (gerund): \"making,\" not \"make.\"",
    },
    {
      category: "word-choice",
      original: "I feel little bit nervous",
      suggestion: "I feel a little nervous",
      explanation:
        "We usually say \"a little\" (or \"a little bit\"), not \"little bit\" alone.",
    },
    {
      category: "naturalness",
      original: "writing journal every day help me to improve",
      suggestion: "writing in a journal every day helps me improve",
      explanation:
        "\"Writing in a journal\" sounds more natural. Drop \"to\" after \"help me\" — native speakers usually say \"helps me improve.\"",
    },
    {
      category: "tone",
      original: "I was thinking about my English learning journey",
      suggestion: "I thought about my English learning journey",
      explanation:
        "In casual journaling, the simple past (\"thought\") often flows better than past continuous (\"was thinking\").",
    },
    {
      category: "punctuation",
      original: "native speakers because I worry",
      suggestion: "native speakers, because I worry",
      explanation:
        "A comma before \"because\" can make long sentences easier to read, though it's optional in short clauses.",
    },
  ],
};

export const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: "mock-1",
    title: "Coffee shop thoughts",
    date: "2026-06-23",
    originalText: SAMPLE_PARAGRAPH,
    correctedText: SAMPLE_ANALYSIS.correctedText,
    tone: "casual",
    grammarScore: 72,
    status: "saved",
  },
  {
    id: "mock-2",
    title: "Weekend hike",
    date: "2026-06-21",
    originalText:
      "Yesterday me and my friend went hiking in the mountain. The weather was very nice and we seen many beautiful views. I was tired but it was worth it.",
    correctedText:
      "Yesterday my friend and I went hiking in the mountains. The weather was lovely and we saw many beautiful views. I was tired, but it was worth it.",
    tone: "casual",
    grammarScore: 68,
    status: "saved",
  },
  {
    id: "mock-3",
    title: "Work presentation",
    date: "2026-06-18",
    originalText:
      "I gave a presentation at work today. I prepared for it since last week and I think it went good. My manager said I did a great job.",
    correctedText:
      "I gave a presentation at work today. I had been preparing for it since last week, and I think it went well. My manager said I did a great job.",
    tone: "neutral",
    grammarScore: 81,
    status: "saved",
  },
  {
    id: "mock-4",
    title: "Rainy afternoon",
    date: "2026-06-15",
    originalText:
      "It was raining all day so I stayed home and read a book. Sometimes I enjoy these quiet days more than busy ones.",
    correctedText:
      "It rained all day, so I stayed home and read a book. Sometimes I enjoy these quiet days more than busy ones.",
    tone: "neutral",
    grammarScore: 92,
    status: "saved",
  },
];

const ENTRY_ANALYSES: Record<string, AnalysisResult> = {
  "mock-1": SAMPLE_ANALYSIS,
  "mock-2": {
    correctedText: MOCK_ENTRIES[1].correctedText,
    tone: "casual",
    grammarScore: 68,
    summary:
      "Good storytelling! Watch subject pronoun order (\"my friend and I\"), irregular past tense (\"saw\" not \"seen\"), and plural \"mountains.\"",
    suggestions: [
      {
        category: "grammar",
        original: "me and my friend",
        suggestion: "my friend and I",
        explanation: "Put yourself second and use \"I\" as the subject: \"my friend and I.\"",
      },
      {
        category: "grammar",
        original: "we seen many beautiful views",
        suggestion: "we saw many beautiful views",
        explanation: "\"Seen\" needs a helper verb (have seen). The simple past is \"saw.\"",
      },
    ],
  },
  "mock-3": {
    correctedText: MOCK_ENTRIES[2].correctedText,
    tone: "neutral",
    grammarScore: 81,
    summary:
      "Clear and professional tone. \"Went good\" should be \"went well,\" and past perfect can show preparation over time.",
    suggestions: [
      {
        category: "word-choice",
        original: "it went good",
        suggestion: "it went well",
        explanation: "Use \"well\" (adverb) to describe how something went, not \"good\" (adjective).",
      },
    ],
  },
  "mock-4": {
    correctedText: MOCK_ENTRIES[3].correctedText,
    tone: "neutral",
    grammarScore: 92,
    summary:
      "This entry is already strong — natural rhythm and clear meaning. Only minor tense polish suggested.",
    suggestions: [
      {
        category: "naturalness",
        original: "It was raining all day",
        suggestion: "It rained all day",
        explanation: "Simple past is slightly more concise for journal writing.",
      },
    ],
  },
};

export function getMockAnalysisForEntry(entryId: string): AnalysisResult | null {
  return ENTRY_ANALYSES[entryId] ?? null;
}

export function generateMockAnalysis(text: string): AnalysisResult {
  if (text.trim() === SAMPLE_PARAGRAPH.trim()) {
    return SAMPLE_ANALYSIS;
  }

  return {
    correctedText: text
      .replace(/\bgo\b/gi, "went")
      .replace(/\bmake\b/gi, "making")
      .replace(/little bit/gi, "a little")
      .replace(/help me to/gi, "help me"),
    tone: "casual",
    grammarScore: Math.floor(65 + Math.random() * 25),
    summary:
      "This is prototype feedback. In the full app, AI will analyze your specific grammar, tone, word choice, and naturalness.",
    suggestions: [
      {
        category: "naturalness",
        original: "your paragraph",
        suggestion: "a polished version",
        explanation:
          "The real app will highlight exact phrases from your text and explain each improvement.",
      },
      {
        category: "grammar",
        original: "example phrase",
        suggestion: "corrected phrase",
        explanation: "Connect OpenAI and Notion in the next phase for live analysis and storage.",
      },
    ],
  };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
