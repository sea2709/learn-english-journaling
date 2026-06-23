# English Journal

An interactive **prototype mockup** for learning English through daily journaling. Write a paragraph, get AI-style feedback on grammar, tone, and word choice, and save entries to Notion.

## What's in this mockup

This is a **UI prototype** — no API keys or Notion connection required.

- **Journal editor** with title and paragraph fields
- **AI feedback panel** with grammar score, tone, polished version, and categorized suggestions
- **Past entries sidebar** with sample journal history
- **Simulated flows** — "Get feedback" and "Save to Notion" use local mock data with loading states

The sample entry is pre-loaded so you can explore the full experience immediately.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Layout

| Area | Purpose |
|------|---------|
| Left sidebar | Past journal entries from Notion (mock data) |
| Center | Write your paragraph |
| Right panel | AI feedback — score, tone, corrections, suggestions |

## Next phase (not built yet)

- OpenAI integration for real grammar and tone analysis
- Notion API to persist entries to your workspace database
- Environment variables: `OPENAI_API_KEY`, `NOTION_API_KEY`, `NOTION_DATABASE_ID`

## Tech stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- TypeScript
