# English Journal

Learn English through daily journaling. Write paragraph by paragraph, get AI feedback on each one, customize what the AI checks, and save your entries to your Supabase account.

## Features

- **Paragraph-by-paragraph writing** — build a journal entry over time, one paragraph at a time
- **Per-paragraph AI feedback** — press `Ctrl+Enter` (or click Check) to analyze only the current paragraph; suggestions appear inline under each block
- **Customizable check focus** — choose which areas AI reviews (grammar, spelling, tone, word choice, naturalness, punctuation) and set an optional learning goal; saved to your account
- **Full-entry review** — open the Feedback drawer for a holistic grammar score, tone, polished version, and suggestions across the whole entry
- **Auto-save** — entries save automatically every 10 seconds; click Save for an immediate write
- **Past entries drawer** — browse entries grouped by month, reload, or delete
- **Entry images** — insert photos between paragraph blocks (private Supabase Storage)
- **User feedback** — send bug reports, ideas, or other notes to admins from the topbar
- **User accounts** — sign in with Google, Facebook, or email via Supabase Auth
- **Swappable AI providers** — Gemini by default, switch models via env vars
- **Admin dashboard** — optional `/admin` page for signup stats, user list, and user-feedback triage (requires `ADMIN_EMAILS` + service role key)

## Quick start

### 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project
2. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open **SQL Editor** and run the schema in [`supabase/schema.sql`](supabase/schema.sql) (re-run after updates to pick up new tables such as `user_preferences`)

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase URL, anon key, and (optionally) an AI API key. For the admin dashboard, also set `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS`.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and start journaling.

## Supabase Auth notes

- By default, Supabase may require **email confirmation** before sign-in works. For local development, disable it under **Authentication → Providers → Email → Confirm email**.
- User identity comes from `auth.users`. Journal entries reference `auth.users(id)` with Row Level Security so each user only sees their own data.

### Password reset (email login)

Email/password users can reset a forgotten password from **Forgot password?** on the sign-in form:

1. The app calls Supabase `resetPasswordForEmail` with redirect  
   `{origin}/auth/callback?next=/auth/reset-password`.
2. The recovery email must land on `/auth/callback` (same allowlist as OAuth). After the code exchange, the user is sent to `/auth/reset-password` to set a new password.
3. Optional: customize the email under **Authentication → Email Templates → Reset Password**.

Ensure **Authentication → URL Configuration** includes your callback URLs (see SSO section below). Query params on the redirect are fine as long as the base callback URL is allowlisted.

### Google and Facebook sign-in (SSO)

The sign-in screen offers **Continue with Google** and **Continue with Facebook**, similar to Medium. Configure each provider in your Supabase project:

1. Open **Authentication → URL Configuration** and add redirect URLs:
   - `http://localhost:3000/auth/callback` (local dev)
   - `https://your-production-domain.com/auth/callback` (production)
2. **Google** — enable under **Authentication → Providers → Google**, then add OAuth client ID and secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Authorized redirect URI in Google must be `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. **Facebook** — enable under **Authentication → Providers → Facebook**, then add App ID and App Secret from [Meta for Developers](https://developers.facebook.com/). Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as a valid OAuth redirect URI in the Facebook app settings.
4. **Facebook data deletion** — set `FACEBOOK_APP_SECRET` in `.env.local` (same App Secret as above). In the [Meta App Dashboard](https://developers.facebook.com/) under **Settings → Basic**, set **Data Deletion Request URL** to:
   - `http://localhost:3000/api/facebook/data-deletion` (local testing with a tunnel if needed)
   - `https://your-production-domain.com/api/facebook/data-deletion` (production)

   When a user removes the app and requests deletion in Facebook, Meta POSTs to that URL. The app deletes the linked account (if any) and returns a confirmation link at `/deletion/<code>`. See [Meta’s data deletion callback docs](https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/data-deletion-callback).

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
2. (Optional) Open **Check focus** in the topbar to choose which areas AI should review and add a short learning goal (e.g. "I'm preparing for IELTS")
3. Write a paragraph in the editor
4. Press **Ctrl+Enter** (or click **Check**; on mobile, tap **Check**) to get AI feedback on that paragraph — suggestions appear inline below the block
5. Press **Enter** to add another paragraph, or **Add image** to insert a photo between blocks
6. Open **Feedback** in the topbar (or hamburger menu on small screens) for a full-entry review (uses your current check focus settings)
7. Entries auto-save every 10 seconds; use **Save** at the bottom of the editor for an immediate write
8. Open **Entries** in the topbar to browse, reload, or delete past entries
9. Use **Send feedback** in the topbar menu to report bugs or share ideas with the team

## Data model

```
auth.users (Supabase Auth)
 ├── journal_entries (title, date, status)
 │    └── journal_paragraphs (block_type, text, analysis JSON, image_path, order)
 └── user_preferences (analysis focus areas + optional learning goal)
 └── user_feedback (bug / idea / other submissions from signed-in users)
storage.buckets entry-images  # private images for entries
```

Row Level Security policies enforce that `user_id = auth.uid()` on all journal and preference tables. Entry images live in the private `entry-images` bucket (`{user_id}/{entry_id}/…`).

## Layout

| Area | Purpose |
|------|---------|
| Topbar (left) | App title + **Entries** button with saved count |
| Topbar (right) | New entry, Sign out, Send feedback, Check focus, Feedback — inline on wide screens; hamburger menu below 640px |
| Center | Title + paragraph blocks with inline per-paragraph notes |
| Editor footer | Auto-save status + **Save** button |
| Left drawer | Saved journal entries grouped by month |
| Right drawer | Full-entry AI review |
| Check focus overlay | Toggle focus areas and set an optional learning goal |
| Send feedback overlay | Submit bug reports, ideas, or other app feedback |

## Mobile UI

On phones and narrow screens, the app prioritizes writing space and touch-friendly controls:

- **Topbar** — **English Journal** and **Entries** (with saved count) stay visible on the left. Other actions (**New entry**, **Sign out**, **Send feedback**, **Check focus**, **Feedback**) move into the **hamburger menu** (☰) on the right.
- **Writing area** — paragraphs use the full screen width; the notebook left margin and red line only appear on larger screens.
- **Paragraph feedback** — tap **Check** on a paragraph after you write it. `Ctrl+Enter` is for desktop keyboards; on mobile, use the button.
- **New paragraph** — press **Enter** on your keyboard, or use the on-screen keyboard’s return key.
- **Save** — auto-save still runs every 10 seconds; tap **Save** at the bottom of the editor when you want an immediate write.
- **Drawers & overlays** — **Entries**, **Feedback**, **Check focus**, and **Send feedback** open as full-screen-friendly overlays; scroll is locked while one is open.

## Admin dashboard

Set `ADMIN_EMAILS` (comma-separated) and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then visit `/admin` while signed in with an allowed email. The dashboard shows signup and activity stats, a searchable user table, and a user-feedback inbox.

## Technical reference (for AI agents)

See [`AGENTS.md`](AGENTS.md) for architecture, file map, API contracts, data model, and conventions. Cursor loads this automatically via `.cursor/rules/technical-reference.mdc`.

## Tech stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- Vercel AI SDK (Gemini / OpenAI)
- TypeScript
