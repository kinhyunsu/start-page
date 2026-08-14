-- Phase 6 버그 수정: google_tokens 저장은 이제 서버(service role)로만 하므로,
-- authenticated 사용자용 insert/update 정책은 필요 없다 (오히려 RLS 충돌의 원인이었음).
-- Supabase SQL Editor에서 실행

drop policy if exists "users can insert own google token" on google_tokens;
drop policy if exists "users can update own google token" on google_tokens;
-- RLS는 계속 활성화된 채로 두되 정책이 하나도 없어야, service role만 접근 가능해진다 (kis_token_cache와 동일 패턴).
