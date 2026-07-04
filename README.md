# English Journal

Learn English through daily journaling. Write paragraph by paragraph, get AI feedback on each one, and save your entries to your Supabase account.

## Features

- **Paragraph-by-paragraph writing** — build a journal entry over time, one paragraph at a time
- **Per-paragraph AI feedback** — press `Ctrl+Enter` (or click Check) to analyze only the current paragraph
- **Grammar score, tone, polished version, and categorized suggestions**
- **Past entries sidebar** — browse and reload saved journal entries
- **User accounts** — sign in with Google, Facebook, or email via Supabase Auth
- **Swappable AI providers** — Gemini by default, switch models via env vars

## Quick start

### 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project
2. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open **SQL Editor** and run the schema in [`supabase/schema.sql`](supabase/schema.sql)

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase URL, anon key, and (optionally) an AI API key.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and start journaling.

## Supabase Auth notes

- By default, Supabase may require **email confirmation** before sign-in works. For local development, disable it under **Authentication → Providers → Email → Confirm email**.
- User identity comes from `auth.users`. Journal entries reference `auth.users(id)` with Row Level Security so each user only sees their own data.

### Google and Facebook sign-in (SSO)

The sign-in screen offers **Continue with Google** and **Continue with Facebook**, similar to Medium. Configure each provider in your Supabase project:

1. Open **Authentication → URL Configuration** and add redirect URLs:
   - `http://localhost:3000/auth/callback` (local dev)
   - `https://your-production-domain.com/auth/callback` (production)
2. **Google** — enable under **Authentication → Providers → Google**, then add OAuth client ID and secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Authorized redirect URI in Google must be `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. **Facebook** — enable under **Authentication → Providers → Facebook**, then add App ID and App Secret from [Meta for Developers](https://developers.facebook.com/). Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as a valid OAuth redirect URI in the Facebook app settings.

After saving provider credentials in Supabase, SSO buttons on the home page will redirect users through the provider and back to `/auth/callback`.

## AI setup

**Gemini (default):**

```env
AI_PROVIDER=google
AI_MODEL=gemini-2.0-flash
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
```

Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey).

**Switch to OpenAI:**

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

Without an API key, the app runs in demo mode with sample analysis responses.

## How to use

1. Register or sign in
2. Write a paragraph in the editor
3. Press **Ctrl+Enter** (or click **Check**) to get AI feedback on that paragraph only
4. Press **Enter** to add another paragraph, or **Add image** to insert a photo between blocks
5. Click **Save** when you're done
6. Past entries appear in the Entries drawer

## Data model

```
auth.users (Supabase Auth)
 └── journal_entries (title, date, status)
      └── journal_paragraphs (block_type, text, analysis JSON, image_path, order)
storage.buckets entry-images  # private images for entries
```

Row Level Security policies enforce that `user_id = auth.uid()` on all journal tables. Entry images live in the private `entry-images` bucket (`{user_id}/{entry_id}/…`).

## Layout

| Area | Purpose |
|------|---------|
| Left sidebar | Saved journal entries |
| Center | Title + paragraph blocks |
| Right panel | AI feedback for the active paragraph |

## Technical reference (for AI agents)

See [`AGENTS.md`](AGENTS.md) for architecture, file map, API contracts, data model, and conventions. Cursor loads this automatically via `.cursor/rules/technical-reference.mdc`.

## Tech stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- Vercel AI SDK (Gemini / OpenAI)
- TypeScript
