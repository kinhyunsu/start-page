import { createClient } from "@supabase/supabase-js";

// 서버 전용 — service role 키는 절대 클라이언트로 노출하지 않는다.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey);
}
