"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";

export default function AuthButton() {
  const user = useUser();
  const { displayName, saveNickname } = useProfile(user);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

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

  function startEditing() {
    setDraft(displayName ?? "");
    setEditing(true);
  }

  async function submitNickname(e: React.FormEvent) {
    e.preventDefault();
    await saveNickname(draft);
    setEditing(false);
  }

  if (user === undefined) {
    return <div className="h-9 w-24" />;
  }

  if (user === null) {
    return (
      <button
        onClick={signIn}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-ink"
      >
        Google로 로그인
      </button>
    );
  }

  const initial = (displayName ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
        {initial}
      </div>

      {editing ? (
        <form onSubmit={submitNickname} className="flex items-center gap-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submitNickname}
            placeholder="닉네임"
            className="w-28 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink outline-none focus:border-accent"
          />
        </form>
      ) : (
        <button
          onClick={startEditing}
          className="group flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          {displayName}
          <span className="text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
            ✏️
          </span>
        </button>
      )}

      <button
        onClick={signOut}
        className="rounded-full border border-border px-2.5 py-1 text-xs text-ink-soft hover:bg-surface-hover"
      >
        로그아웃
      </button>
    </div>
  );
}
