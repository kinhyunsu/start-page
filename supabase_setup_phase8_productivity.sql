-- Phase 8: 할 일 / 구독 관리 / 가계부
-- Supabase SQL Editor에서 실행

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table todos enable row level security;
create policy "users can read own todos" on todos for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own todos" on todos for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own todos" on todos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own todos" on todos for delete to authenticated using (auth.uid() = user_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price numeric not null check (price >= 0),
  currency text not null default 'KRW' check (currency in ('KRW', 'USD')),
  billing_day int not null check (billing_day between 1 and 31),
  created_at timestamptz not null default now()
);
alter table subscriptions enable row level security;
create policy "users can read own subscriptions" on subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own subscriptions" on subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own subscriptions" on subscriptions for delete to authenticated using (auth.uid() = user_id);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  category text not null,
  memo text,
  spent_on date not null default current_date,
  created_at timestamptz not null default now()
);
alter table expenses enable row level security;
create policy "users can read own expenses" on expenses for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own expenses" on expenses for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own expenses" on expenses for delete to authenticated using (auth.uid() = user_id);
