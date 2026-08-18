"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import WidgetCard from "./WidgetCard";

type Memo = { id: string; entry_date: string; content: string };

const RECENT_COUNT = 10;

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

export default function MemoWidget() {
  const user = useUser();
  const [memos, setMemos] = useState<Memo[] | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const today = todayLocal();

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("daily_memos")
      .select("id, entry_date, content")
      .order("entry_date", { ascending: false })
      .limit(RECENT_COUNT);
    if (loadError) {
      setError("메모를 불러오지 못했습니다. Supabase에 daily_memos 테이블이 있는지 확인해주세요.");
      setMemos([]);
      return;
    }
    setError(null);
    setMemos(data ?? []);

    const todayMemo = (data ?? []).find((m) => m.entry_date === today);
    setContent(todayMemo?.content ?? "");
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setSubmitting(true);
    setSaved(false);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("daily_memos")
      .upsert(
        { user_id: user.id, entry_date: today, content: content.trim() },
        { onConflict: "user_id,entry_date" }
      );
    setSubmitting(false);
    if (saveError) {
      setError("저장에 실패했습니다: " + saveError.message);
      return;
    }
    setSaved(true);
    load();
  }

  const pastMemos = (memos ?? []).filter((m) => m.entry_date !== today);

  return (
    <WidgetCard title="하루 메모">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <p className="py-4 text-center text-sm text-ink-faint">로그인하면 이용할 수 있어요</p>
      )}

      {user && (
        <>
          <form onSubmit={handleSave} className="mb-3">
            <textarea
              rows={3}
              placeholder="오늘 하루 자유롭게 메모해보세요"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSaved(false);
              }}
              className="mb-1.5 w-full resize-none rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
            >
              저장
            </button>
            {saved && <span className="ml-2 text-xs text-ink-faint">저장됐어요 ✓</span>}
          </form>

          {error && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-500">{error}</p>
          )}

          {memos !== null && pastMemos.length > 0 && (
            <div className="border-t border-border pt-2">
              <p className="mb-1 text-xs font-semibold text-ink-faint uppercase">지난 메모</p>
              <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                {pastMemos.map((m) => (
                  <li key={m.id}>
                    <span className="font-mono tabular-nums text-ink-faint">
                      {formatDate(m.entry_date)}
                    </span>
                    <p className="text-ink-soft whitespace-pre-wrap">{m.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
}
