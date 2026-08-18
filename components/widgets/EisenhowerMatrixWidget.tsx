"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { signInWithGoogle } from "@/lib/googleAuth";
import WidgetCard from "./WidgetCard";

type MatrixTask = {
  id: string;
  title: string;
  important: boolean;
  urgent: boolean;
  done: boolean;
};

type Quadrant = { important: boolean; urgent: boolean; label: string; hint: string };

const QUADRANTS: Quadrant[] = [
  { important: true, urgent: true, label: "긴급 + 중요", hint: "지금 바로" },
  { important: true, urgent: false, label: "중요", hint: "계획하기" },
  { important: false, urgent: true, label: "긴급", hint: "빠르게 처리" },
  { important: false, urgent: false, label: "둘 다 아님", hint: "나중에" },
];

const emptyForm = { title: "", important: false, urgent: false };

export default function EisenhowerMatrixWidget() {
  const user = useUser();
  const [tasks, setTasks] = useState<MatrixTask[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("matrix_tasks")
      .select("id, title, important, urgent, done")
      .order("created_at", { ascending: true });
    if (loadError) {
      setError("할 일을 불러오지 못했습니다. Supabase에 matrix_tasks 테이블이 있는지 확인해주세요.");
      setTasks([]);
      return;
    }
    setError(null);
    setTasks(data ?? []);
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title || !user) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("matrix_tasks").insert({
      user_id: user.id,
      title,
      important: form.important,
      urgent: form.urgent,
    });
    setSubmitting(false);
    if (insertError) {
      setError("추가에 실패했습니다: " + insertError.message);
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function toggleDone(task: MatrixTask) {
    const supabase = createClient();
    await supabase.from("matrix_tasks").update({ done: !task.done }).eq("id", task.id);
    load();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("matrix_tasks").delete().eq("id", id);
    load();
  }

  return (
    <WidgetCard title="사분면 시간관리" className="sm:col-span-2 lg:col-span-3">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-ink-soft">사분면 시간관리를 쓰려면 로그인이 필요합니다.</p>
          <button
            onClick={signInWithGoogle}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"
          >
            Google로 로그인
          </button>
        </div>
      )}

      {user && (
        <>
          <form onSubmit={handleAdd} className="mb-3 flex flex-wrap items-center gap-2">
            <input
              required
              placeholder="할 일 입력"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="min-w-40 flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
            />
            <label className="flex items-center gap-1 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={form.important}
                onChange={(e) => setForm({ ...form, important: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
              중요
            </label>
            <label className="flex items-center gap-1 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={form.urgent}
                onChange={(e) => setForm({ ...form, urgent: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
              긴급
            </label>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
            >
              추가
            </button>
          </form>

          {error && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-500">{error}</p>
          )}

          {tasks === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

          {tasks !== null && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUADRANTS.map((q) => {
                const items = tasks.filter(
                  (t) => t.important === q.important && t.urgent === q.urgent
                );
                return (
                  <div
                    key={`${q.important}-${q.urgent}`}
                    className="rounded-xl border border-border p-3"
                  >
                    <p className="mb-2 text-xs font-semibold text-ink-faint uppercase">
                      {q.label}
                      <span className="ml-1 font-normal normal-case text-ink-faint">
                        · {q.hint}
                      </span>
                    </p>
                    {items.length === 0 && (
                      <p className="text-xs text-ink-faint">할 일이 없습니다.</p>
                    )}
                    <ul className="space-y-1">
                      {items.map((t) => (
                        <li key={t.id} className="group flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => toggleDone(t)}
                            className="h-4 w-4 accent-accent"
                          />
                          <span
                            className={`flex-1 ${
                              t.done ? "text-ink-faint line-through" : "text-ink"
                            }`}
                          >
                            {t.title}
                          </span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-xs text-ink-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
}
