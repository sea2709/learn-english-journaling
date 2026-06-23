import { Client } from "@notionhq/client";
import type { AnalysisResult, JournalEntry } from "./types";

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NOTION_API_KEY is not configured. Add it to your .env.local file."
    );
  }
  return new Client({ auth: apiKey });
}

function getDatabaseId() {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error(
      "NOTION_DATABASE_ID is not configured. Add it to your .env.local file."
    );
  }
  return databaseId;
}

function getRichText(value: string) {
  const chunks: { type: "text"; text: { content: string } }[] = [];
  const maxChunk = 2000;
  for (let i = 0; i < value.length; i += maxChunk) {
    chunks.push({
      type: "text" as const,
      text: { content: value.slice(i, i + maxChunk) },
    });
  }
  return chunks.length > 0 ? chunks : [{ type: "text" as const, text: { content: "" } }];
}

function getPlainText(
  prop: { type: string; rich_text?: { plain_text: string }[] } | undefined
): string {
  if (!prop || prop.type !== "rich_text" || !prop.rich_text) return "";
  return prop.rich_text.map((t) => t.plain_text).join("");
}

function getSelectName(
  prop: { type: string; select?: { name: string } | null } | undefined
): string {
  if (!prop || prop.type !== "select" || !prop.select) return "";
  return prop.select.name;
}

function getTitle(
  prop: { type: string; title?: { plain_text: string }[] } | undefined
): string {
  if (!prop || prop.type !== "title" || !prop.title) return "Untitled";
  return prop.title.map((t) => t.plain_text).join("") || "Untitled";
}

function getDate(
  prop:
    | { type: string; date?: { start: string } | null }
    | undefined
): string {
  if (!prop || prop.type !== "date" || !prop.date?.start) return "";
  return prop.date.start.split("T")[0];
}

function pageToEntry(page: {
  id: string;
  url: string | null;
  properties: Record<string, unknown>;
}): JournalEntry {
  const props = page.properties as Record<
    string,
    {
      type: string;
      title?: { plain_text: string }[];
      rich_text?: { plain_text: string }[];
      select?: { name: string } | null;
      number?: number | null;
      date?: { start: string } | null;
    }
  >;

  return {
    id: page.id,
    url: page.url ?? undefined,
    title: getTitle(props.Title),
    date: getDate(props.Date),
    originalText: getPlainText(props["Original Text"]),
    correctedText: getPlainText(props["Corrected Text"]),
    tone: getSelectName(props.Tone),
    grammarScore: props["Grammar Score"]?.number ?? null,
    status: getSelectName(props.Status) || "saved",
  };
}

export async function saveEntry(
  title: string,
  originalText: string,
  analysis: AnalysisResult
): Promise<JournalEntry> {
  const notion = getNotionClient();
  const databaseId = getDatabaseId();
  const today = new Date().toISOString().split("T")[0];

  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Title: {
        title: [{ type: "text", text: { content: title || `Journal ${today}` } }],
      },
      Date: { date: { start: today } },
      "Original Text": { rich_text: getRichText(originalText) },
      "Corrected Text": { rich_text: getRichText(analysis.correctedText) },
      Tone: { select: { name: analysis.tone } },
      "Grammar Score": { number: analysis.grammarScore },
      Status: { select: { name: "saved" } },
    },
  });

  return {
    id: response.id,
    url: "url" in response ? (response.url as string) : undefined,
    title: title || `Journal ${today}`,
    date: today,
    originalText,
    correctedText: analysis.correctedText,
    tone: analysis.tone,
    grammarScore: analysis.grammarScore,
    status: "saved",
  };
}

export async function listEntries(limit = 20): Promise<JournalEntry[]> {
  const notion = getNotionClient();
  const databaseId = getDatabaseId();

  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: "Date", direction: "descending" }],
    page_size: limit,
  });

  return response.results
    .filter((page): page is Extract<typeof page, { properties: unknown }> => "properties" in page)
    .map((page) =>
      pageToEntry({
        id: page.id,
        url: "url" in page ? (page.url as string) : null,
        properties: page.properties as Record<string, unknown>,
      })
    );
}
