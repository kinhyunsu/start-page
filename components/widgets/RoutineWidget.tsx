"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import WidgetCard from "./WidgetCard";

type Routine = { id: string; name: string };

function dateStr(d: Date) {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function computeStreak(logDates: Set<string>) {
  let streak = 0;
  const cursor = new Date();
  if (!logDates.has(dateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (logDates.has(dateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function RoutineWidget() {
  const user = useUser();
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [logsByRoutine, setLogsByRoutine] = useState<Record<string, Set<string>>>({});
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const supabase = createClient();

    const { data: routineData, error: routineError } = await supabase
      .from("routines")
      .select("id, name")
      .order("created_at", { ascending: true });

    if (routineError) {
      setError("루틴을 불러오지 못했습니다. Supabase에 routines/routine_logs 테이블이 있는지 확인해주세요.");
      setRoutines([]);
      return;
    }

    const { data: logData, error: logError } = await supabase
      .from("routine_logs")
      .select("routine_id, log_date");

    if (logError) {
      setError("루틴 기록을 불러오지 못했습니다.");
      setRoutines(routineData ?? []);
      return;
    }

    const grouped: Record<string, Set<string>> = {};
    for (const row of logData ?? []) {
      const key = row.routine_id as string;
      if (!grouped[key]) grouped[key] = new Set();
      grouped[key].add(row.log_date as string);
    }

    setError(null);
    setRoutines(routineData ?? []);
    setLogsByRoutine(grouped);
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name || !user) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("routines").insert({ user_id: user.id, name });
    setSubmitting(false);
    if (insertError) {
      setError("추가에 실패했습니다: " + insertError.message);
      return;
    }
    setInput("");
    load();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("routines").delete().eq("id", id);
    load();
  }

  async function toggleToday(routine: Routine) {
    if (!user) return;
    const supabase = createClient();
    const today = dateStr(new Date());
    const doneToday = logsByRoutine[routine.id]?.has(today) ?? false;

    if (doneToday) {
      await supabase
        .from("routine_logs")
        .delete()
        .eq("routine_id", routine.id)
        .eq("log_date", today);
    } else {
      await supabase
        .from("routine_logs")
        .insert({ user_id: user.id, routine_id: routine.id, log_date: today });
    }
    load();
  }

  const today = dateStr(new Date());

  return (
    <WidgetCard title="루틴">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <p className="py-4 text-center text-sm text-ink-faint">로그인하면 이용할 수 있어요</p>
      )}

      {user && (
        <>
          <form onSubmit={handleAdd} className="mb-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="루틴 입력 후 Enter (예: 운동, 독서)"
              className="flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
            >
              추가
            </button>
          </form>

          {error && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-500">{error}</p>
          )}

          {routines === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

          {routines !== null && (
            <>
              {!error && routines.length === 0 && (
                <p className="text-sm text-ink-faint">등록된 루틴이 없습니다.</p>
              )}
              <ul className="space-y-1.5 text-sm">
                {routines.map((r) => {
                  const doneToday = logsByRoutine[r.id]?.has(today) ?? false;
                  const streak = computeStreak(logsByRoutine[r.id] ?? new Set());
                  return (
                    <li key={r.id} className="group flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={doneToday}
                        onChange={() => toggleToday(r)}
                        className="h-4 w-4 accent-accent"
                      />
                      <span className="flex-1 text-ink">{r.name}</span>
                      {streak > 0 && (
                        <span className="font-mono text-xs tabular-nums text-accent">🔥 {streak}일째</span>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs text-ink-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
                      >
                        삭제
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
