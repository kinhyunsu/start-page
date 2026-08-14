import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    const refreshToken = data.session?.provider_refresh_token;
    if (!error && refreshToken && data.user) {
      await supabase.from("google_tokens").upsert({
        user_id: data.user.id,
        refresh_token: refreshToken,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
