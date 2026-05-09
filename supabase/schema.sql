-- ============================================================
-- Run this entire file in Supabase → SQL Editor → New query
-- ============================================================

-- 1. Prototypes table
create table if not exists public.prototypes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  description  text,
  plan         text,
  storage_path text not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. Row Level Security — users only ever touch their own rows
alter table public.prototypes enable row level security;

create policy "owner select" on public.prototypes
  for select using (auth.uid() = user_id);

create policy "owner insert" on public.prototypes
  for insert with check (auth.uid() = user_id);

create policy "owner update" on public.prototypes
  for update using (auth.uid() = user_id);

create policy "owner delete" on public.prototypes
  for delete using (auth.uid() = user_id);

-- 3. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.prototypes
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Storage — run AFTER creating the bucket in the Supabase UI:
--   Storage → New bucket → name: "prototypes" → Private
-- ============================================================

create policy "owner upload" on storage.objects
  for insert with check (
    bucket_id = 'prototypes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner read" on storage.objects
  for select using (
    bucket_id = 'prototypes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner overwrite" on storage.objects
  for update using (
    bucket_id = 'prototypes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner delete" on storage.objects
  for delete using (
    bucket_id = 'prototypes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
