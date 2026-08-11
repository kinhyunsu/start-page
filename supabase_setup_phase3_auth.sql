-- Phase 3: Google 로그인 + 사용자별 데이터 분리 (Supabase SQL Editor에서 실행)

truncate table holdings;
alter table holdings add column user_id uuid not null references auth.users(id) default auth.uid();

drop policy if exists "anon can read holdings" on holdings;
drop policy if exists "anon can insert holdings" on holdings;
drop policy if exists "anon can update holdings" on holdings;
drop policy if exists "anon can delete holdings" on holdings;

create policy "users can read own holdings" on holdings for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own holdings" on holdings for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own holdings" on holdings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own holdings" on holdings for delete to authenticated using (auth.uid() = user_id);
