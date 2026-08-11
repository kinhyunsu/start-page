"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";

export function fallbackDisplayName(user: User) {
  return (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "사용자";
}

export function useProfile(user: User | null | undefined) {
  const [nickname, setNickname] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      setNickname(undefined);
      return;
    }

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setNickname(data?.nickname ?? null));
  }, [user]);

  async function saveNickname(next: string) {
    if (!user) return;
    const supabase = createClient();
    const trimmed = next.trim();
    await supabase
      .from("profiles")
      .upsert({ id: user.id, nickname: trimmed || null, updated_at: new Date().toISOString() });
    setNickname(trimmed || null);
  }

  const displayName = user ? nickname ?? fallbackDisplayName(user) : null;

  return { nickname, displayName, saveNickname };
}
