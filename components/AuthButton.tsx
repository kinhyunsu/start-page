"use client";

import { createClient } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/useUser";

export default function AuthButton() {
  const user = useUser();

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (user === undefined) {
    return <div className="h-8 w-20" />;
  }

  if (user === null) {
    return (
      <button
        onClick={signIn}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Google로 로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{user.email}</span>
      <button
        onClick={signOut}
        className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        로그아웃
      </button>
    </div>
  );
}
