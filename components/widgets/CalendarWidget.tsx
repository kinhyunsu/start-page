"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { signInWithGoogle } from "@/lib/googleAuth";
import WidgetCard from "./WidgetCard";

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
};

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

const emptyTaskForm = { title: "", important: false, urgent: false };

function todayInSeoul(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) return "종일";
  return new Date(event.start).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

const fieldClass =
  "rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

const tabClass = (active: boolean) =>
  `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
    active ? "bg-accent text-white" : "bg-accent-soft text-ink-soft hover:text-ink"
  }`;

export default function CalendarWidget() {
  const user = useUser();
  const [tab, setTab] = useState<"events" | "tasks">("events");

  // 일정 탭 상태
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = todayInSeoul(0);
  const tomorrow = todayInSeoul(1);

  const [form, setForm] = useState({
    summary: "",
    date: today,
    startTime: "09:00",
    endTime: "10:00",
  });

  // 할 일 탭 상태
  const [tasks, setTasks] = useState<MatrixTask[] | null>(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  async function loadEvents() {
    try {
      const res = await fetch("/api/calendar");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "일정을 가져오지 못했습니다.");
        return;
      }
      setNeedsConnect(!!json.needsConnect);
      setEvents(json.events ?? []);
      setError(null);
    } catch {
      setError("일정을 가져오지 못했습니다.");
    }
  }

  async function loadTasks() {
    if (!user) return;
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("matrix_tasks")
      .select("id, title, important, urgent, done")
      .order("created_at", { ascending: true });
    if (loadError) {
      setTaskError("할 일을 불러오지 못했습니다. Supabase에 matrix_tasks 테이블이 있는지 확인해주세요.");
      setTasks([]);
      return;
    }
    setTaskError(null);
    setTasks(data ?? []);
  }

  useEffect(() => {
    if (!user) return;
    loadEvents();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const start = `${form.date}T${form.startTime}:00+09:00`;
    const end = `${form.date}T${form.endTime}:00+09:00`;

    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: form.summary, start, end }),
    });

    setSubmitting(false);
    if (res.ok) {
      setForm({ summary: "", date: today, startTime: "09:00", endTime: "10:00" });
      setShowAddForm(false);
      loadEvents();
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const title = taskForm.title.trim();
    if (!title || !user) return;
    setTaskSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("matrix_tasks").insert({
      user_id: user.id,
      title,
      important: taskForm.important,
      urgent: taskForm.urgent,
    });
    setTaskSubmitting(false);
    if (insertError) {
      setTaskError("추가에 실패했습니다: " + insertError.message);
      return;
    }
    setTaskForm(emptyTaskForm);
    loadTasks();
  }

  async function toggleTaskDone(task: MatrixTask) {
    const supabase = createClient();
    await supabase.from("matrix_tasks").update({ done: !task.done }).eq("id", task.id);
    loadTasks();
  }

  async function handleDeleteTask(id: string) {
    const supabase = createClient();
    await supabase.from("matrix_tasks").delete().eq("id", id);
    loadTasks();
  }

  const todayEvents = events?.filter((e) => e.start.slice(0, 10) === today) ?? [];
  const tomorrowEvents = events?.filter((e) => e.start.slice(0, 10) === tomorrow) ?? [];

  return (
    <WidgetCard title="캘린더" className="sm:col-span-2 lg:col-span-3">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <p className="py-4 text-center text-sm text-ink-faint">로그인하면 이용할 수 있어요</p>
      )}

      {user && (
        <>
          <div className="mb-3 flex gap-2">
            <button className={tabClass(tab === "events")} onClick={() => setTab("events")}>
              일정
            </button>
            <button className={tabClass(tab === "tasks")} onClick={() => setTab("tasks")}>
              할 일
            </button>
          </div>

          {tab === "events" && (
            <>
              {error && <p className="text-sm text-red-500">{error}</p>}

              {!error && events === null && (
                <p className="text-sm text-ink-faint">불러오는 중...</p>
              )}

              {!error && events !== null && needsConnect && (
                <div className="py-4 text-center">
                  <p className="mb-3 text-sm text-ink-soft">구글 캘린더 연결이 필요합니다.</p>
                  <button
                    onClick={signInWithGoogle}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"
                  >
                    구글 캘린더 연결하기
                  </button>
                </div>
              )}

              {!error && events !== null && !needsConnect && (
                <>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="mb-1 text-xs font-semibold text-ink-faint uppercase">오늘</p>
                      {todayEvents.length === 0 && <p className="text-ink-faint">일정 없음</p>}
                      {todayEvents.map((ev) => (
                        <div key={ev.id} className="flex items-baseline gap-2 py-0.5">
                          <span className="font-mono text-xs tabular-nums text-ink-faint">
                            {formatEventTime(ev)}
                          </span>
                          <span className="text-ink">{ev.summary}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold text-ink-faint uppercase">내일</p>
                      {tomorrowEvents.length === 0 && <p className="text-ink-faint">일정 없음</p>}
                      {tomorrowEvents.map((ev) => (
                        <div key={ev.id} className="flex items-baseline gap-2 py-0.5">
                          <span className="font-mono text-xs tabular-nums text-ink-faint">
                            {formatEventTime(ev)}
                          </span>
                          <span className="text-ink">{ev.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddForm((v) => !v)}
                    className="mt-3 text-xs font-medium text-accent hover:text-accent-ink"
                  >
                    {showAddForm ? "닫기" : "+ 일정 추가"}
                  </button>

                  {showAddForm && (
                    <form onSubmit={handleAddEvent} className="mt-2 flex flex-col gap-2">
                      <input
                        required
                        placeholder="제목"
                        value={form.summary}
                        onChange={(e) => setForm({ ...form, summary: e.target.value })}
                        className={fieldClass}
                      />
                      <div className="flex gap-2">
                        <input
                          required
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className={`${fieldClass} flex-1`}
                        />
                        <input
                          required
                          type="time"
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                          className={`${fieldClass} w-24`}
                        />
                        <input
                          required
                          type="time"
                          value={form.endTime}
                          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                          className={`${fieldClass} w-24`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
                      >
                        추가
                      </button>
                    </form>
                  )}
                </>
              )}
            </>
          )}

          {tab === "tasks" && (
            <>
              <form onSubmit={handleAddTask} className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  required
                  placeholder="할 일 입력"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="min-w-40 flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
                />
                <label className="flex items-center gap-1 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={taskForm.important}
                    onChange={(e) => setTaskForm({ ...taskForm, important: e.target.checked })}
                    className="h-4 w-4 accent-accent"
                  />
                  중요
                </label>
                <label className="flex items-center gap-1 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={taskForm.urgent}
                    onChange={(e) => setTaskForm({ ...taskForm, urgent: e.target.checked })}
                    className="h-4 w-4 accent-accent"
                  />
                  긴급
                </label>
                <button
                  type="submit"
                  disabled={taskSubmitting || !taskForm.title.trim()}
                  className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
                >
                  추가
                </button>
              </form>

              {taskError && (
                <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-500">
                  {taskError}
                </p>
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
                                onChange={() => toggleTaskDone(t)}
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
                                onClick={() => handleDeleteTask(t.id)}
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
        </>
      )}
    </WidgetCard>
  );
}
