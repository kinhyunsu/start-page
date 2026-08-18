-- Phase 10: 아이젠하워 매트릭스 + 하루 3줄 회고
-- Supabase SQL Editor에서 실행

create table if not exists matrix_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  important boolean not null default false,
  urgent boolean not null default false,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table matrix_tasks enable row level security;
create policy "users can read own matrix_tasks" on matrix_tasks for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own matrix_tasks" on matrix_tasks for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own matrix_tasks" on matrix_tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own matrix_tasks" on matrix_tasks for delete to authenticated using (auth.uid() = user_id);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  line1 text,
  line2 text,
  line3 text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
alter table journal_entries enable row level security;
create policy "users can read own journal_entries" on journal_entries for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own journal_entries" on journal_entries for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own journal_entries" on journal_entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
