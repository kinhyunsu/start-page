"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import WidgetCard from "./WidgetCard";

type JournalEntry = {
  id: string;
  entry_date: string;
  line1: string | null;
  line2: string | null;
  line3: string | null;
};

const RECENT_COUNT = 5;

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

const emptyForm = { line1: "", line2: "", line3: "" };

export default function JournalWidget() {
  const user = useUser();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const today = todayLocal();

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("journal_entries")
      .select("id, entry_date, line1, line2, line3")
      .order("entry_date", { ascending: false })
      .limit(RECENT_COUNT);
    if (loadError) {
      setError("회고를 불러오지 못했습니다. Supabase에 journal_entries 테이블이 있는지 확인해주세요.");
      setEntries([]);
      return;
    }
    setError(null);
    setEntries(data ?? []);

    const todayEntry = (data ?? []).find((e) => e.entry_date === today);
    if (todayEntry) {
      setForm({
        line1: todayEntry.line1 ?? "",
        line2: todayEntry.line2 ?? "",
        line3: todayEntry.line3 ?? "",
      });
    }
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSaved(false);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("journal_entries")
      .upsert(
        {
          user_id: user.id,
          entry_date: today,
          line1: form.line1.trim() || null,
          line2: form.line2.trim() || null,
          line3: form.line3.trim() || null,
        },
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

  const pastEntries = (entries ?? []).filter((e) => e.entry_date !== today);

  return (
    <WidgetCard title="하루 3줄 회고">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <p className="py-4 text-center text-sm text-ink-faint">로그인하면 이용할 수 있어요</p>
      )}

      {user && (
        <>
          <form onSubmit={handleSave} className="mb-3 space-y-1.5">
            <p className="text-xs text-ink-faint">오늘 하루, 딱 3줄만</p>
            {(["line1", "line2", "line3"] as const).map((key, i) => (
              <input
                key={key}
                placeholder={`${i + 1}. `}
                value={form[key]}
                onChange={(e) => {
                  setForm({ ...form, [key]: e.target.value });
                  setSaved(false);
                }}
                className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              />
            ))}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
            >
              저장
            </button>
            {saved && <span className="ml-2 text-xs text-ink-faint">저장됐어요 ✓</span>}
          </form>

          {error && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-500">{error}</p>
          )}

          {entries !== null && pastEntries.length > 0 && (
            <div className="border-t border-border pt-2">
              <p className="mb-1 text-xs font-semibold text-ink-faint uppercase">지난 기록</p>
              <ul className="space-y-2 text-xs">
                {pastEntries.map((e) => (
                  <li key={e.id}>
                    <span className="font-mono tabular-nums text-ink-faint">
                      {formatDate(e.entry_date)}
                    </span>
                    <ul className="ml-1 text-ink-soft">
                      {[e.line1, e.line2, e.line3]
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={i}>· {line}</li>
                        ))}
                    </ul>
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
