-- Phase 13: 사이드바 즐겨찾기 (자주 가는 페이지)
-- Supabase SQL Editor에서 실행

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  created_at timestamptz not null default now()
);
alter table bookmarks enable row level security;
create policy "users can read own bookmarks" on bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own bookmarks" on bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own bookmarks" on bookmarks for delete to authenticated using (auth.uid() = user_id);
