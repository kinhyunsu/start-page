-- Phase 4: 닉네임 저장용 profiles 테이블 (Supabase SQL Editor에서 실행)

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "users can read own profile" on profiles for select to authenticated using (auth.uid() = id);
create policy "users can insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "users can update own profile" on profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
