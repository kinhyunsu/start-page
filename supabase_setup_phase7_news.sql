-- Phase 7: 게임 업데이트 탭에서 사용자가 직접 추가/삭제하는 관심 게임 목록
-- Supabase SQL Editor에서 실행

create table if not exists tracked_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table tracked_games enable row level security;
create policy "users can read own tracked_games" on tracked_games for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own tracked_games" on tracked_games for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own tracked_games" on tracked_games for delete to authenticated using (auth.uid() = user_id);
