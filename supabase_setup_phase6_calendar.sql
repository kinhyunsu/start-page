-- Phase 6: 구글 캘린더 refresh token 저장용 테이블 (Supabase SQL Editor에서 실행)

create table if not exists google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table google_tokens enable row level security;
create policy "users can insert own google token" on google_tokens for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own google token" on google_tokens for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- select 정책 없음: refresh token은 서버(service role)만 읽을 수 있고, 클라이언트에서는 절대 다시 못 읽는다.
