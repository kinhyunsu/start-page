-- Phase 2: 포트폴리오 위젯용 테이블 (Supabase SQL Editor에서 실행)

create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null check (asset_type in ('stock', 'crypto')),
  symbol text not null,            -- 업비트 'KRW-BTC' 또는 KIS 6자리 종목코드 '005930'
  name text,
  quantity numeric not null check (quantity > 0),
  avg_buy_price numeric not null check (avg_buy_price >= 0),
  currency text not null default 'KRW' check (currency in ('KRW', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table holdings enable row level security;
create policy "anon can read holdings" on holdings for select to anon using (true);
create policy "anon can insert holdings" on holdings for insert to anon with check (true);
create policy "anon can update holdings" on holdings for update to anon using (true) with check (true);
create policy "anon can delete holdings" on holdings for delete to anon using (true);

create table if not exists kis_token_cache (
  id int primary key default 1,
  access_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table kis_token_cache enable row level security;
