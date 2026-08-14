"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { signInWithGoogle } from "@/lib/googleAuth";
import WidgetCard from "./WidgetCard";

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
};

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

export default function CalendarWidget() {
  const user = useUser();
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

  useEffect(() => {
    if (!user) return;
    loadEvents();
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

  const todayEvents = events?.filter((e) => e.start.slice(0, 10) === today) ?? [];
  const tomorrowEvents = events?.filter((e) => e.start.slice(0, 10) === tomorrow) ?? [];

  return (
    <WidgetCard title="캘린더">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-ink-soft">캘린더를 보려면 로그인이 필요합니다.</p>
          <button
            onClick={signInWithGoogle}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"
          >
            Google로 로그인
          </button>
        </div>
      )}

      {user && error && <p className="text-sm text-red-500">{error}</p>}

      {user && !error && events === null && (
        <p className="text-sm text-ink-faint">불러오는 중...</p>
      )}

      {user && !error && events !== null && needsConnect && (
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

      {user && !error && events !== null && !needsConnect && (
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
    </WidgetCard>
  );
}
