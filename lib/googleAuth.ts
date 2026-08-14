import { createClient } from "./supabase-browser";

// 로그인 버튼이 여러 군데(AuthButton, PhotoWidget, PortfolioWidget, CalendarWidget)에
// 있어도 전부 이 함수를 써야 캘린더 권한이 누락되지 않는다.
export async function signInWithGoogle() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: "https://www.googleapis.com/auth/calendar.events",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}
