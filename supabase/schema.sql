-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.journal_entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  date text not null,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_paragraphs (
  id uuid primary key,
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  "order" integer not null,
  text text not null default '',
  analyzed_text text,
  analysis jsonb,
  block_type text not null default 'text',
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_paragraphs_block_type_check
    check (block_type in ('text', 'image')),
  constraint journal_paragraphs_image_path_check
    check (
      (block_type = 'text' and image_path is null)
      or (block_type = 'image' and image_path is not null)
    )
);

-- Additive migration for existing databases:
alter table public.journal_paragraphs
  add column if not exists block_type text not null default 'text';

alter table public.journal_paragraphs
  add column if not exists image_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'journal_paragraphs_block_type_check'
  ) then
    alter table public.journal_paragraphs
      add constraint journal_paragraphs_block_type_check
      check (block_type in ('text', 'image'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'journal_paragraphs_image_path_check'
  ) then
    alter table public.journal_paragraphs
      add constraint journal_paragraphs_image_path_check
      check (
        (block_type = 'text' and image_path is null)
        or (block_type = 'image' and image_path is not null)
      );
  end if;
end $$;

create index if not exists journal_entries_user_updated_idx
  on public.journal_entries (user_id, updated_at desc);

create index if not exists journal_paragraphs_entry_id_idx
  on public.journal_paragraphs (entry_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

drop trigger if exists journal_paragraphs_set_updated_at on public.journal_paragraphs;
create trigger journal_paragraphs_set_updated_at
  before update on public.journal_paragraphs
  for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;
alter table public.journal_paragraphs enable row level security;

drop policy if exists "Users can view own entries" on public.journal_entries;
create policy "Users can view own entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own entries" on public.journal_entries;
create policy "Users can insert own entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own entries" on public.journal_entries;
create policy "Users can update own entries"
  on public.journal_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own entries" on public.journal_entries;
create policy "Users can delete own entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own paragraphs" on public.journal_paragraphs;
create policy "Users can view own paragraphs"
  on public.journal_paragraphs for select
  using (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own paragraphs" on public.journal_paragraphs;
create policy "Users can insert own paragraphs"
  on public.journal_paragraphs for insert
  with check (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own paragraphs" on public.journal_paragraphs;
create policy "Users can update own paragraphs"
  on public.journal_paragraphs for update
  using (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own paragraphs" on public.journal_paragraphs;
create policy "Users can delete own paragraphs"
  on public.journal_paragraphs for delete
  using (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

-- Entry images (private bucket). Path: {user_id}/{entry_id}/{image_id}.{ext}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-images',
  'entry-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view own entry images" on storage.objects;
create policy "Users can view own entry images"
  on storage.objects for select
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload own entry images" on storage.objects;
create policy "Users can upload own entry images"
  on storage.objects for insert
  with check (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own entry images" on storage.objects;
create policy "Users can update own entry images"
  on storage.objects for update
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own entry images" on storage.objects;
create policy "Users can delete own entry images"
  on storage.objects for delete
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Per-user AI check preferences (focus areas + optional learning goal)
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  analysis_preferences jsonb not null default '{"focusAreas":["grammar","tone","word-choice","naturalness","punctuation"]}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

drop policy if exists "Users can view own preferences" on public.user_preferences;
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);
