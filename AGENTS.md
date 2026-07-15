# English Journal — Technical Reference

Read this document before exploring or changing the codebase. It describes architecture, conventions, and where to look for common tasks.

## What this app does

A Next.js journaling app for English learners. Users write journal entries **paragraph by paragraph**, get **per-paragraph AI feedback** (grammar, tone, suggestions) inline under each block, request a **full-entry review** in a feedback drawer, and **save entries** to Supabase. Users can customize **check focus** — which areas AI reviews (grammar, spelling, tone, etc.) and an optional learning goal — persisted per account. Auth is required for persistence and preferences; analysis works without login (demo mode when no AI key is set, using default focus areas).

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3 — palettes: `ink`, `sage`, `coral`, `pen`; fonts `display` (Fraunces), `sans` / `mono` (Courier Prime) |
| Database & auth | Supabase (Postgres + Auth + RLS) via `@supabase/ssr` |
| AI | Vercel AI SDK (`ai`) — Google Gemini (default) or OpenAI, selected by env vars |
| Validation | Zod (AI response schema in `src/lib/ai.ts`; preferences schema in `src/lib/analysis-preferences.ts`) |

## Project layout

```
src/
├── app/
│   ├── page.tsx                    # Renders <AuthGate />
│   ├── layout.tsx                  # Root layout, fonts, globals
│   ├── admin/page.tsx              # Admin dashboard (ADMIN_EMAILS gate)
│   ├── deletion/[code]/page.tsx    # Public Facebook data-deletion status page
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth / recovery code exchange → redirect (supports ?next=)
│   │   └── reset-password/page.tsx # Set new password after recovery email
│   └── api/
│       ├── analyze/
│       │   ├── route.ts            # POST — per-paragraph AI analysis (no auth)
│       │   ├── review/route.ts     # POST — full-entry review (no auth)
│       │   └── suggestion-chat/route.ts # POST — ask about one suggestion (no auth)
│       ├── entries/
│       │   ├── route.ts            # GET list, POST upsert (auth required)
│       │   └── [id]/route.ts       # GET one, DELETE (auth required)
│       ├── preferences/
│       │   └── route.ts            # GET/PATCH — analysis preferences (auth required)
│       ├── feedback/
│       │   └── route.ts            # POST user feedback (auth required)
│       ├── facebook/
│       │   └── data-deletion/route.ts  # POST Meta data deletion callback (no auth)
│       └── admin/
│           ├── stats/route.ts      # GET auth stats (admin only)
│           ├── users/route.ts      # GET paginated user list (admin only)
│           ├── feedback/route.ts   # GET paginated feedback list (admin only)
│           └── feedback/[id]/route.ts  # PATCH feedback status/notes (admin only)
├── components/
│   ├── AuthGate.tsx                # Session gate → AuthForm or JournalApp
│   ├── AuthForm.tsx                # Email + social sign-in + forgot password
│   ├── ResetPasswordForm.tsx       # New password after recovery link
│   ├── SocialAuthButtons.tsx       # Google / Facebook OAuth
│   ├── JournalApp.tsx              # Main app shell & state orchestration
│   ├── TopActionsMenu.tsx          # Topbar actions; hamburger menu below 640px
│   ├── ParagraphEditor.tsx         # Multi-block editor (text + images)
│   ├── ParagraphBlock.tsx          # Single paragraph + Check + inline notes
│   ├── ImageBlock.tsx              # Entry image preview + remove
│   ├── EntryDrawer.tsx             # Past entries overlay (left)
│   ├── FeedbackDrawer.tsx          # Full-entry review overlay (right)
│   ├── FeedbackForm.tsx            # User feedback overlay (bug / idea / other)
│   ├── CheckFocusSettings.tsx      # Check focus overlay (focus areas + learning goal)
│   ├── SuggestionRow.tsx           # Collapsible suggestion row + optional ask-AI thread
│   ├── ScoreRing.tsx               # Grammar score ring (0–10 display)
│   ├── AdminDashboard.tsx          # Admin stats + user table
│   └── AdminFeedbackSection.tsx    # Admin user-feedback triage table
├── hooks/
│   └── useAutoSaveEntry.ts         # Debounced auto-save (10s), flush, dirty tracking
├── lib/
│   ├── types.ts                    # Shared TypeScript types
│   ├── api.ts                      # Client-side fetch wrappers + ApiError
│   ├── ai.ts                       # AI provider, schema, mock analysis, suggestion chat
│   ├── suggestion-discussion.ts    # Per-suggestion chat message limits
│   ├── analysis-preferences.ts     # Focus-area constants, Zod schema, defaults
│   ├── preferences-db.ts           # Supabase CRUD for user_preferences
│   ├── entries-db.ts               # Supabase CRUD for entries/blocks
│   ├── entry-images.ts             # Supabase Storage upload/signed URL/delete
│   ├── entry-utils.ts              # Block helpers, list-item mapping, month groups
│   ├── feedback-db.ts              # Supabase CRUD for user_feedback
│   ├── feedback-schema.ts          # Feedback category constants + Zod schema
│   ├── facebook-signed-request.ts  # Verify Meta signed_request payloads
│   ├── data-deletion.ts            # Facebook data deletion + status lookup
│   ├── admin-auth.ts               # requireAdmin(), ADMIN_EMAILS parsing
│   ├── admin-users.ts              # Supabase Admin API: list users, stats
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── server.ts               # Server Supabase client (cookies)
│       ├── admin.ts                # Service-role Supabase client
│       └── middleware.ts           # updateSession() helper for proxy
└── proxy.ts                        # Next.js proxy — refreshes auth cookies on all routes
supabase/schema.sql                 # DB schema + RLS policies (run in Supabase SQL Editor)
```

## Architecture

```mermaid
flowchart TB
  subgraph client [Browser]
    AuthGate --> JournalApp
    JournalApp --> TopActionsMenu
    JournalApp --> ParagraphEditor
    JournalApp --> EntryDrawer
    JournalApp --> FeedbackDrawer
    JournalApp --> FeedbackForm
    JournalApp --> CheckFocusSettings
    JournalApp --> useAutoSave["hooks/useAutoSaveEntry"]
    ParagraphEditor --> ParagraphBlock
    ParagraphBlock --> SuggestionRow
    FeedbackDrawer --> ScoreRing
    FeedbackDrawer --> SuggestionRow
    AdminPage["app/admin"] --> AdminDashboard
    AdminDashboard --> AdminFeedbackSection
  end

  subgraph next [Next.js API Routes]
    analyze["POST /api/analyze"]
    review["POST /api/analyze/review"]
    suggestionChat["POST /api/analyze/suggestion-chat"]
    preferences["GET/PATCH /api/preferences"]
    entries["GET/POST /api/entries"]
    entryId["GET/DELETE /api/entries/:id"]
    adminStats["GET /api/admin/stats"]
    adminUsers["GET /api/admin/users"]
    adminFeedback["GET/PATCH /api/admin/feedback"]
    userFeedback["POST /api/feedback"]
  end

  subgraph services [Services]
    ai["lib/ai.ts"]
    db["lib/entries-db.ts"]
    prefsDb["lib/preferences-db.ts"]
    adminDb["lib/admin-users.ts"]
    supa["Supabase"]
  end

  JournalApp --> analyze
  JournalApp --> review
  JournalApp --> suggestionChat
  JournalApp --> preferences
  JournalApp --> entries
  JournalApp --> entryId
  AdminDashboard --> adminStats
  AdminDashboard --> adminUsers
  AdminFeedbackSection --> adminFeedback
  JournalApp --> userFeedback
  analyze --> ai
  review --> ai
  suggestionChat --> ai
  entries --> db
  entryId --> db
  preferences --> prefsDb
  adminStats --> adminDb
  adminUsers --> adminDb
  db --> supa
  prefsDb --> supa
  adminDb --> supa
  AuthGate --> supa
```

### Request flow: analyze paragraph

1. User presses **Ctrl+Enter** or **Check** on a `ParagraphBlock`.
2. `JournalApp.handleAnalyzeParagraph` calls `analyzeText(text, analysisPreferences)` from `lib/api.ts`.
3. `POST /api/analyze` validates text (non-empty, ≤ 5000 chars) and optional `preferences` (defaults to all focus areas).
4. If no AI API key → `getMockAnalysis()`; else `lib/ai.ts` `generateObject()` with Zod schema. Prompts and post-filtering respect `preferences.focusAreas` and `preferences.customNote`. Each suggestion gets an app-assigned `id` via `withSuggestionIds()`.
5. Result stored on the paragraph as `{ analysis, analyzedText }` in React state (and persisted on entry save via `analysis` / `analyzed_text`).
6. Inline `SuggestionRow` components under the paragraph show suggestions; stale edits are flagged via `isParagraphStale()`.
7. Re-Check replaces `analysis` entirely (including any per-suggestion `discussion` threads).

### Request flow: ask about a suggestion

1. User expands a paragraph suggestion and asks a follow-up in `SuggestionRow` (paragraph notes only; Feedback drawer stays view-only).
2. `JournalApp.handleAskSuggestion` calls `askAboutSuggestion()` with paragraph text, the suggestion fields, prior `discussion` messages, and preferences.
3. `POST /api/analyze/suggestion-chat` validates payload (paragraph ≤ 5000 chars, message ≤ 1000 chars, ≤ 20 stored messages after the reply).
4. If no AI API key → `getMockSuggestionReply()`; else `discussSuggestion()` via `generateText` with a suggestion-scoped system prompt.
5. User + assistant turns are appended to `suggestion.discussion` on that paragraph’s analysis; auto-save persists the updated JSONB.

### Request flow: full-entry review

1. User opens the **Feedback** drawer from the topbar.
2. `JournalApp` calls `analyzeEntryReview()` with all text blocks joined and current `analysisPreferences`.
3. `POST /api/analyze/review` validates text (non-empty, ≤ 20,000 chars) and optional `preferences`.
4. If no AI API key → `getMockEntryReview()`; else `reviewEntry()` in `lib/ai.ts`.
5. `FeedbackDrawer` shows score (`ScoreRing`), tone, summary, polished version, focus summary, and `SuggestionRow` list.

The topbar feedback badge counts **paragraph-level** `suggestions.length`, not entry-review suggestions.

### Request flow: check focus preferences

1. On sign-in, `JournalApp` calls `fetchPreferences()` → `GET /api/preferences`.
2. `getPreferencesForUser()` in `preferences-db.ts` returns existing row or inserts defaults (`DEFAULT_ANALYSIS_PREFERENCES` from `analysis-preferences.ts`).
3. User opens **Check focus** from the topbar → `CheckFocusSettings` overlay.
4. User toggles focus areas (at least one required) and optionally sets a learning goal (≤ 300 chars).
5. Save calls `savePreferences()` → `PATCH /api/preferences` → `upsertPreferencesForUser()`.
6. Updated preferences are passed to subsequent paragraph checks and entry reviews.

### Request flow: save entry

1. Edits to title or blocks trigger debounced auto-save (10s) via `useAutoSaveEntry` in `JournalApp`; user can also click **Save** for an immediate write.
2. Both paths build a `StoredJournalEntry` (client-generated UUID for new entries) and call `POST /api/entries`.
3. `upsertEntryForUser()` in `entries-db.ts`:
   - Updates existing entry + syncs blocks (upsert + delete removed IDs), or
   - Inserts new entry; if user has ≥ 50 entries, deletes oldest by `updated_at`.
   - Text blocks persist `analyzed_text` and `analysis` JSONB (including per-suggestion `discussion`).
4. Saved entry returned; entries list refreshes on manual save, when the entries drawer opens, or on a debounced timer after auto-save.
5. `flush()` runs before switching entries to avoid losing unsaved edits; `beforeunload` warns when dirty.

### Auth flow

- `AuthGate` subscribes to `supabase.auth.onAuthStateChange`.
- Email: `signUp` / `signInWithPassword` in `AuthForm`.
- Forgot password: `AuthForm` calls `resetPasswordForEmail` → recovery email → `/auth/callback?next=/auth/reset-password` → `ResetPasswordForm` calls `updateUser({ password })` → redirect `/`.
- OAuth: `signInWithOAuth` → provider → `/auth/callback` → `exchangeCodeForSession` → redirect `/`.
- `proxy.ts` calls `updateSession()` from `lib/supabase/middleware.ts` to refresh cookies on every request.
- API routes use **server** `createClient()` and reject unauthenticated entry and preferences requests with 401.

### Admin flow

- `/admin` page checks session + `ADMIN_EMAILS` via `isAdminEmail()`; redirects non-admins home.
- `AdminDashboard` fetches `GET /api/admin/stats` and `GET /api/admin/users` (paginated, sortable).
- `AdminFeedbackSection` fetches `GET /api/admin/feedback` and updates rows via `PATCH /api/admin/feedback/:id`.
- Admin routes use `requireAdmin()` and `lib/supabase/admin.ts` (service role key).

## Data model

### Postgres (Supabase)

```
auth.users
 ├── journal_entries (id, user_id, title, date, status, created_at, updated_at)
 │    └── journal_paragraphs (id, entry_id, order, block_type, text, analyzed_text, analysis jsonb, image_path)
 └── user_preferences (user_id, analysis_preferences jsonb, created_at, updated_at)
 └── user_feedback (id, user_id, user_email, category, message, contact_note, status, internal_notes, created_at, updated_at)
data_deletion_requests (confirmation_code, facebook_user_id, supabase_user_id, status, message, …)  # service role only
storage.buckets entry-images  # private; path {user_id}/{entry_id}/{image_id}.ext
```

RLS: all policies enforce `user_id = auth.uid()` (entries, preferences) or entry ownership (paragraphs). Storage objects are scoped to the first path folder (`auth.uid()`). `data_deletion_requests` has RLS enabled with no client policies (service role only). Schema in `supabase/schema.sql`.

`journal_paragraphs` stores an ordered list of **blocks**: `block_type = 'text'` (writing + analysis) or `'image'` (`image_path` only).

`user_preferences.analysis_preferences` stores `{ focusAreas: string[], customNote?: string }`. Defaults to all six focus areas when missing or invalid.

### TypeScript types (`src/lib/types.ts`)

| Type | Purpose |
|------|---------|
| `SuggestionCategory` | Focus area enum: `grammar`, `spelling`, `tone`, `word-choice`, `naturalness`, `punctuation` |
| `AnalysisFocusArea` | Alias of `SuggestionCategory` |
| `AnalysisPreferences` | User check focus: `focusAreas[]`, optional `customNote` (≤ 300 chars) |
| `AnalysisResult` | AI output: `correctedText`, `tone`, `grammarScore`, `summary`, `suggestions[]` |
| `EntryReviewResult` | Alias of `AnalysisResult` for full-entry review |
| `Suggestion` | One fix: `id`, `category`, `original`, `suggestion`, `explanation`, optional `discussion[]` |
| `SuggestionMessage` | Follow-up chat turn: `role` (`user` \| `assistant`), `content` |
| `JournalParagraph` | Text block: `type: "text"`, `id`, `text`, `analysis`, `analyzedText` |
| `JournalImageBlock` | Image block: `type: "image"`, `id`, `path` (storage path) |
| `EntryBlock` | `JournalParagraph \| JournalImageBlock` |
| `StoredJournalEntry` | Full entry for save/load: `id`, `title`, `date`, `blocks[]`, `status` |
| `JournalEntryListItem` | Drawer summary: avg grammar score, latest tone, paragraph count |
| `AdminStats` | User signup and activity counts |
| `AdminUserRow` | One row in admin user table |
| `AdminUsersResponse` | Paginated user list + total count |
| `FeedbackCategory` | User feedback type: `bug`, `idea`, `other` |
| `FeedbackStatus` | Admin workflow: `new`, `read`, `archived` |
| `UserFeedbackSubmission` | Client payload: category, message, optional contactNote |
| `AdminFeedbackRow` | Full feedback row for admin list/detail |
| `AdminFeedbackResponse` | Paginated feedback list + newCount |

### Paragraph staleness

`entry-utils.isParagraphStale()` compares `text.trim()` to `analyzedText`. If the user edits after analysis, the paragraph is stale (UI reflects this in `ParagraphBlock`).

### Grammar score display

Scores are stored 0–100 in the DB and AI schema. `ScoreRing.scoreToDisplay()` converts to a 0–10 scale for UI.

## API reference

| Method | Path | Auth | Body / response |
|--------|------|------|-----------------|
| `POST` | `/api/analyze` | No | `{ text, preferences? }` → `{ analysis, mock }` |
| `POST` | `/api/analyze/review` | No | `{ text, preferences? }` → `{ review, mock }` |
| `POST` | `/api/analyze/suggestion-chat` | No | `{ paragraphText, suggestion, messages, preferences? }` → `{ reply, mock }` |
| `GET` | `/api/preferences` | Yes | → `{ preferences: AnalysisPreferences }` |
| `PATCH` | `/api/preferences` | Yes | `AnalysisPreferences` → `{ preferences: AnalysisPreferences }` |
| `GET` | `/api/entries` | Yes | → `{ entries: JournalEntryListItem[] }` |
| `POST` | `/api/entries` | Yes | `StoredJournalEntry` → `{ entry }` |
| `GET` | `/api/entries/:id` | Yes | → `{ entry: StoredJournalEntry }` |
| `DELETE` | `/api/entries/:id` | Yes | → `{ success: true }` |
| `GET` | `/api/admin/stats` | Admin | → `AdminStats` |
| `GET` | `/api/admin/users` | Admin | `?page&limit&sort&order` → `AdminUsersResponse` |
| `POST` | `/api/feedback` | Yes | `{ category, message, contactNote? }` → `{ success: true }` |
| `GET` | `/api/admin/feedback` | Admin | `?page&perPage&status&sort&order` → `AdminFeedbackResponse` |
| `PATCH` | `/api/admin/feedback/:id` | Admin | `{ status?, internalNotes? }` → `{ feedback: AdminFeedbackRow }` |
| `POST` | `/api/facebook/data-deletion` | No (Meta signed) | form `signed_request` → `{ url, confirmation_code }` |

Client wrappers in `lib/api.ts`: `analyzeText`, `analyzeEntryReview`, `askAboutSuggestion`, `fetchPreferences`, `savePreferences`, `listEntries`, `fetchEntry`, `saveEntry`, `deleteEntry`, `fetchAdminStats`, `fetchAdminUsers`, `submitFeedback`, `fetchAdminFeedback`, `updateAdminFeedback`.

Errors return `{ error: string }` with 4xx/5xx. Client code throws `ApiError` from `lib/api.ts`.

Facebook data deletion: Meta POSTs a signed request to `/api/facebook/data-deletion`. The handler verifies HMAC with `FACEBOOK_APP_SECRET`, deletes the matching account when found, and records status at `/deletion/:code` (`data_deletion.ts`).

## Environment variables

See `.env.example`. Required for full functionality:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini (default provider) |
| `AI_PROVIDER` | `google` (default) or `openai` |
| `AI_MODEL` | e.g. `gemini-2.0-flash`, `gpt-4o-mini` |
| `OPENAI_API_KEY` | When `AI_PROVIDER=openai` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; admin dashboard + data deletion |
| `ADMIN_EMAILS` | Comma-separated emails allowed to access `/admin` |
| `FACEBOOK_APP_SECRET` | Meta App Secret; verify data deletion signed_request |

Without an AI key, `/api/analyze`, `/api/analyze/review`, and `/api/analyze/suggestion-chat` return mock data (`mock: true`); UI shows a demo banner.

## UI layout

Centered single-column editor (`max-w-sheet`) with a sticky topbar and overlay drawers on large and small screens (`JournalApp`):

| Area | Component | Notes |
|------|-----------|-------|
| Topbar left | `JournalApp` | Brand title + **Entries** button (saved count badge) |
| Topbar right | `TopActionsMenu` | Wide screens: inline New entry, Sign out, Send feedback, Check focus, Feedback (badge = inline note count). Below 640px: hamburger menu with the same actions |
| Center | Title + `ParagraphEditor` + save footer | Main writing area; per-paragraph feedback inline; active block shows focus summary; **Save** button and auto-save status in footer (not topbar) |
| Left overlay | `EntryDrawer` | Past entries grouped by month; new entry, refresh, delete |
| Right overlay | `FeedbackDrawer` | Full-entry AI review on demand; shows current focus summary |
| Overlay | `CheckFocusSettings` | Focus-area toggles + optional learning goal |
| Overlay | `FeedbackForm` | Submit app feedback (bug / idea / other) |

**Mobile editor:** no left notebook margin or dot below `sm`; writing area is full width. Notebook margin (`pl-14` + `.notebook-margin::before` dot) applies from `sm` up.

Key CSS utilities in `globals.css`: `.topbar`, `.topbar-left`, `.top-actions`, `.feedback-btn`, `.pen`, `.lnk`, `.notebook-margin`, `.writing-dim`, `body.drawer-open` (scroll lock when entries, feedback, check-focus, or feedback-form overlay is open).

## Conventions for agents

### Git branches

When starting work on a tracked ticket or issue, branch from `main` before making changes. Full details: [`.cursor/rules/branch-naming.mdc`](.cursor/rules/branch-naming.mdc).

| Issue type | Branch pattern | Example |
|------------|----------------|---------|
| Feature, enhancement, chore | `feature/<id>-<short-slug>` | `feature/7-journal-topbar-header` |
| Bug fix | `bug/<id>-<short-slug>` | `bug/12-save-entry-missing` |

Use lowercase kebab-case for the slug (2–5 words from the ticket title). One ticket per branch.

### Do

- Keep **paragraph-level** analysis — do not merge all paragraphs into one AI call unless explicitly requested. Image blocks are not analyzed.
- Use `StoredJournalEntry` / `EntryBlock` for persistence; use `entries-db.ts` for DB access and `entry-images.ts` for Storage.
- Use `createClient()` from `supabase/server.ts` in API routes, `supabase/client.ts` in client components.
- Match existing Tailwind tokens (`ink-*`, `sage-*`, `coral-*`, `pen-*`) and `paper-texture` class from globals.
- Run `supabase/schema.sql` when changing the DB schema; update `entries-db.ts` or `preferences-db.ts` mappers accordingly.
- Pass `analysisPreferences` from `JournalApp` through to analyze API calls; filter suggestions server-side in `ai.ts` via `filterSuggestions()`.

### Avoid

- Adding auth to `/api/analyze`, `/api/analyze/review`, or `/api/analyze/suggestion-chat` unless product requirements change (currently public for simpler demo; preferences are optional in the request body).
- Storing analysis only at entry level — analysis lives on each text block’s `journal_paragraphs.analysis` JSONB column (including per-suggestion `discussion`).
- Persisting signed image URLs — store `image_path` only; sign on read.
- Exposing `SUPABASE_SERVICE_ROLE_KEY` to the client (no `NEXT_PUBLIC_` prefix).

### Key constants

- `MAX_ENTRIES_PER_USER = 50` in `entries-db.ts`
- Analyze text limit: 5000 characters in `api/analyze/route.ts`
- Entry review limit: 20,000 characters in `api/analyze/review/route.ts`
- Suggestion chat: 1000 chars/message, 20 messages/thread in `suggestion-discussion.ts`
- Learning goal (`customNote`) limit: 300 characters in `analysis-preferences.ts`
- Auto-save debounce: 10 seconds in `hooks/useAutoSaveEntry.ts`
- Default title: `formatTodayDisplay()` → e.g. "Jun 24, 2026"
- Default focus areas: all six categories in `DEFAULT_ANALYSIS_PREFERENCES` (`analysis-preferences.ts`)

## Common tasks — where to change what

| Task | Files |
|------|-------|
| Change AI prompt or output shape | `src/lib/ai.ts` (also update `types.ts` + UI if schema changes) |
| Check focus / analysis preferences | `CheckFocusSettings.tsx`, `analysis-preferences.ts`, `preferences-db.ts`, `app/api/preferences/`, `JournalApp.tsx`, `ai.ts` |
| Add API endpoint | `src/app/api/...`, wrapper in `src/lib/api.ts` |
| Change save/load logic | `src/lib/entries-db.ts`, `src/app/api/entries/` |
| DB schema / RLS | `supabase/schema.sql` |
| Auth providers / forms | `AuthForm.tsx`, `SocialAuthButtons.tsx`, `ResetPasswordForm.tsx`, Supabase dashboard |
| Facebook data deletion callback | `app/api/facebook/data-deletion/`, `facebook-signed-request.ts`, `data-deletion.ts`, `app/deletion/[code]/`, `schema.sql` |
| Editor behavior | `ParagraphEditor.tsx`, `ParagraphBlock.tsx`, `JournalApp.tsx`, `hooks/useAutoSaveEntry.ts` |
| Inline paragraph feedback | `ParagraphBlock.tsx`, `SuggestionRow.tsx` |
| Ask about a suggestion | `SuggestionRow.tsx`, `JournalApp.tsx`, `ai.ts` (`discussSuggestion`), `app/api/analyze/suggestion-chat/`, `suggestion-discussion.ts` |
| Full-entry review drawer | `FeedbackDrawer.tsx`, `ScoreRing.tsx`, `JournalApp.tsx` |
| Entries drawer | `EntryDrawer.tsx`, `entry-utils.groupEntriesByMonth()`, `entry-utils.toListItem()` |
| Topbar / mobile actions menu | `TopActionsMenu.tsx`, `JournalApp.tsx`, `globals.css` (`.topbar`, `.top-actions`) |
| User feedback form | `FeedbackForm.tsx`, `feedback-schema.ts`, `feedback-db.ts`, `app/api/feedback/` |
| Admin dashboard | `AdminDashboard.tsx`, `AdminFeedbackSection.tsx`, `lib/admin-auth.ts`, `lib/admin-users.ts`, `lib/feedback-db.ts`, `app/api/admin/` |

## Scripts

```bash
npm run dev      # local dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

## User-facing docs

Setup, OAuth configuration, and usage instructions are in `README.md` (human-oriented). This file is the agent-oriented technical reference.
