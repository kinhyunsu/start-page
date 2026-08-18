-- Phase 12: 하루 메모 (journal_entries 대신 자유 텍스트 daily_memos)
-- Supabase SQL Editor에서 실행

create table if not exists daily_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
alter table daily_memos enable row level security;
create policy "users can read own daily_memos" on daily_memos for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own daily_memos" on daily_memos for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own daily_memos" on daily_memos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
