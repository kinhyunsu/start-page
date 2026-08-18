-- Phase 9: 할 일 -> 루틴 트래커 전환 + 가계부 고정지출
-- Supabase SQL Editor에서 실행

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table routines enable row level security;
create policy "users can read own routines" on routines for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own routines" on routines for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own routines" on routines for delete to authenticated using (auth.uid() = user_id);

create table if not exists routine_logs (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (routine_id, log_date)
);
alter table routine_logs enable row level security;
create policy "users can read own routine_logs" on routine_logs for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own routine_logs" on routine_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own routine_logs" on routine_logs for delete to authenticated using (auth.uid() = user_id);

create table if not exists fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount >= 0),
  billing_day int not null check (billing_day between 1 and 31),
  created_at timestamptz not null default now()
);
alter table fixed_expenses enable row level security;
create policy "users can read own fixed_expenses" on fixed_expenses for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own fixed_expenses" on fixed_expenses for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own fixed_expenses" on fixed_expenses for delete to authenticated using (auth.uid() = user_id);
