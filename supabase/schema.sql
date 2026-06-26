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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create policy "Users can view own entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.journal_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

create policy "Users can view own paragraphs"
  on public.journal_paragraphs for select
  using (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "Users can insert own paragraphs"
  on public.journal_paragraphs for insert
  with check (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "Users can update own paragraphs"
  on public.journal_paragraphs for update
  using (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "Users can delete own paragraphs"
  on public.journal_paragraphs for delete
  using (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );
