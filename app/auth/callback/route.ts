import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    const refreshToken = data.session?.provider_refresh_token;

    if (!error && refreshToken && data.user) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { error: upsertError } = await admin.from("google_tokens").upsert({
          user_id: data.user.id,
          refresh_token: refreshToken,
          updated_at: new Date().toISOString(),
        });
        if (upsertError) {
          console.error("[auth/callback] google_tokens upsert error:", upsertError.message);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
