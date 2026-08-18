"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { signInWithGoogle } from "@/lib/googleAuth";
import WidgetCard from "./WidgetCard";

type Todo = { id: string; title: string; done: boolean };

export default function TodoWidget() {
  const user = useUser();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDone, setShowDone] = useState(false);

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("todos")
      .select("id, title, done")
      .order("created_at", { ascending: true });
    setTodos(data ?? []);
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = input.trim();
    if (!title || !user) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("todos").insert({ user_id: user.id, title });
    setInput("");
    setSubmitting(false);
    load();
  }

  async function toggleDone(todo: Todo) {
    const supabase = createClient();
    await supabase.from("todos").update({ done: !todo.done }).eq("id", todo.id);
    load();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("todos").delete().eq("id", id);
    load();
  }

  const active = todos?.filter((t) => !t.done) ?? [];
  const done = todos?.filter((t) => t.done) ?? [];

  return (
    <WidgetCard title="할 일">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-ink-soft">할 일 목록을 쓰려면 로그인이 필요합니다.</p>
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
          <form onSubmit={handleAdd} className="mb-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="할 일 입력 후 Enter"
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

          {todos === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

          {todos !== null && (
            <>
              {active.length === 0 && done.length === 0 && (
                <p className="text-sm text-ink-faint">할 일이 없습니다.</p>
              )}
              <ul className="space-y-1 text-sm">
                {active.map((t) => (
                  <li key={t.id} className="group flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleDone(t)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="flex-1 text-ink">{t.title}</span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-ink-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>

              {done.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowDone((v) => !v)}
                    className="text-xs font-medium text-ink-faint hover:text-accent"
                  >
                    {showDone ? "완료 항목 숨기기" : `완료 ${done.length}개 보기`}
                  </button>
                  {showDone && (
                    <ul className="mt-1 space-y-1 text-sm">
                      {done.map((t) => (
                        <li key={t.id} className="group flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => toggleDone(t)}
                            className="h-4 w-4 accent-accent"
                          />
                          <span className="flex-1 text-ink-faint line-through">{t.title}</span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-xs text-ink-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
