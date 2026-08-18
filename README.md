# 시작페이지

브라우저 홈 화면으로 열어두고 쓰는 개인 대시보드. 검색·날씨·캘린더 같은 기본 위젯부터 포트폴리오·구독·가계부·루틴 같은 로그인 기반 개인 위젯까지, 하루에 여러 번 들여다보는 것들을 한 페이지에 모았다.

**Live**: https://start-page-umber.vercel.app

## 주요 기능

**공개 위젯** (로그인 불필요)
- 네이버 검색 (새 탭으로 결과 이동)
- 시계 · 날씨 · 미세먼지 (Open-Meteo)
- 뉴스 (정치 / 실시간 핫뉴스 / 관심 게임 업데이트, Google News RSS)

**개인 위젯** (Google 로그인 후)
- 캘린더 — Google Calendar 양방향 동기화(폰↔웹), 같은 카드에서 "할 일" 탭으로 아이젠하워 매트릭스(중요·긴급 4분면) 함께 관리
- 포트폴리오 — 업비트 코인 시세 실시간 반영, 수익률 계산
- 정기 결제 — 구독·고정비 등록, 다음 결제일 자동 계산, 자주 쓰는 서비스 12종은 실제 브랜드 로고로 표시
- 가계부 — 지출 기록 + 정기 결제 자동 합산으로 이번 달 총지출 계산
- 루틴 — 매일 체크 + 연속 기록(스트릭)
- 즐겨찾기 — 자주 가는 사이트를 파비콘 아이콘으로
- 사진 — 여러 장 업로드 시 자동 슬라이드
- 하루 메모

## 기술 스택

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Supabase** — Postgres, Auth(Google OAuth), Storage, Row Level Security
- **Vercel** 배포
- 외부 API: Open-Meteo(날씨), Google Calendar API, Upbit(시세), Google News RSS, Steam API, simpleicons.org(브랜드 로고)
- 전부 무료 티어 / 무료 API로만 구성 (유료 API·서비스 없음)

## 설계에서 신경 쓴 부분

**서버 전용 시크릿 분리**: Google OAuth의 refresh token, KIS 토큰 캐시처럼 클라이언트가 절대 봐서는 안 되는 값은 RLS 정책을 아예 만들지 않고 `service_role` 클라이언트로만 접근하도록 설계했다. 일반 사용자 데이터(포트폴리오, 구독 등)는 반대로 `auth.uid() = user_id` 기반 RLS로 사용자 스스로도 자기 행만 보게 제한한다.

**OAuth 토큰 갱신**: Supabase는 자체 세션은 자동 갱신하지만 Google이 발급한 provider token은 갱신해주지 않는다. 최초 로그인 시 받은 refresh token을 서버 DB에 저장해두고, 캘린더를 불러올 때마다 서버에서 새 access token으로 교환하는 방식으로 처리했다.

**위젯 겹침 정리**: 기능이 늘어나면서 구독 관리와 가계부의 "고정지출"이 구조적으로 같아지는 문제가 생겼다(이름+금액+매월 결제일). 사용자가 같은 지출을 두 군데 중복 입력할 수 있는 상황이라, 가계부는 구독 목록을 읽어와 합산만 하고 등록 자체는 한 곳(정기 결제)에서만 하도록 통합했다. 마찬가지로 캘린더와 아이젠하워 매트릭스도 겉보기엔 둘 다 "할 일"이라 헷갈려서, 하나의 카드 안에 탭으로 합쳤다.

## 개발 중 겪은 문제

구글 캘린더 연동이 계속 "연결하기"만 반복되고 넘어가지 않는 문제가 있었다. 서비스 롤 키 누락 → OAuth state 만료로 원인을 좁혀가다가, 서버 로그에서 실제 원인을 찾았다: refresh token 교환 자체는 매번 성공하고 있었는데, 그 토큰을 저장하는 `upsert` 쿼리가 RLS 정책 위반으로 조용히 실패하고 있었다. 콜백 라우트가 일반 세션 클라이언트로 저장을 시도했는데, 이 테이블은 애초에 서버 전용으로 설계해서 `authenticated` 역할용 정책이 없었던 게 원인이었다. 콜백 라우트를 service role 클라이언트로 쓰도록 바꿔서 해결했다.

## 의도적으로 만들지 않은 것

- **AI 기반 코멘트/뉴스 요약**: Anthropic API가 결제 등록이 필요해서 포기했다.
- **네이버 뉴스 검색 API**: 신청 자체가 사업자 등록을 요구해서 개인 계정으로는 발급이 막혀 있었다. 대신 가입·키 발급이 필요 없는 Google News RSS로 전환했다.
- **카드/은행 결제내역 자동 연동**: 오픈뱅킹·마이데이터 API는 금융위원회 인가를 받은 사업자만 신청할 수 있는 영역이라 개인 프로젝트로는 불가능하다. 로그인 정보로 화면을 긁어오는 우회도 있지만 보안·약관 위반 소지가 있어 시도하지 않았다.

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.local`에 아래 값이 필요하다 (Supabase 프로젝트, Google Cloud Console에서 직접 발급):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`KIS_APP_KEY` / `KIS_APP_SECRET` / `KIS_ACCOUNT_NO`는 한국투자증권 Open API 키로, 비워두면 포트폴리오 위젯의 국내 주식 항목만 "설정 필요"로 표시되고 나머지는 정상 동작한다.

DB 스키마는 저장소 루트의 `supabase_setup_*.sql` 파일들을 Supabase SQL Editor에서 순서대로 실행하면 된다.
