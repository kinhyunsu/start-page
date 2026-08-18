"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { signInWithGoogle } from "@/lib/googleAuth";
import WidgetCard from "./WidgetCard";

type Expense = {
  id: string;
  amount: number;
  category: string;
  memo: string | null;
  spent_on: string;
};

const CATEGORIES = ["식비", "교통", "쇼핑", "문화·여가", "고정비", "기타"];

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const emptyForm = { amount: "", category: CATEGORIES[0], spent_on: todayLocal(), memo: "" };

const fieldClass =
  "rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

function formatWon(amount: number) {
  return `₩${new Intl.NumberFormat("ko-KR").format(amount)}`;
}

export default function ExpenseWidget() {
  const user = useUser();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("expenses")
      .select("id, amount, category, memo, spent_on")
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false });
    setExpenses(data ?? []);
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("expenses").insert({
      user_id: user.id,
      amount: Number(form.amount),
      category: form.category,
      memo: form.memo.trim() || null,
      spent_on: form.spent_on,
    });
    setForm({ ...emptyForm, spent_on: form.spent_on });
    setSubmitting(false);
    load();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    load();
  }

  const thisMonth = todayLocal().slice(0, 7);
  const monthExpenses = expenses?.filter((e) => e.spent_on.slice(0, 7) === thisMonth) ?? [];
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <WidgetCard title="가계부">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-ink-soft">가계부를 쓰려면 로그인이 필요합니다.</p>
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
          <form onSubmit={handleAdd} className="mb-3 grid grid-cols-2 gap-1.5">
            <input
              required
              type="number"
              min="0"
              step="any"
              placeholder="금액"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`${fieldClass} font-mono`}
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={fieldClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.spent_on}
              onChange={(e) => setForm({ ...form, spent_on: e.target.value })}
              className={fieldClass}
            />
            <input
              placeholder="메모(선택)"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className={fieldClass}
            />
            <button
              type="submit"
              disabled={submitting}
              className="col-span-2 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
            >
              추가
            </button>
          </form>

          {expenses === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

          {expenses !== null && (
            <>
              <p className="mb-1 font-mono text-lg font-semibold tabular-nums text-ink">
                {formatWon(monthTotal)}
                <span className="ml-1 text-xs font-normal text-ink-faint">이번 달 합계</span>
              </p>

              {Object.keys(byCategory).length > 0 && (
                <p className="mb-2 text-xs text-ink-faint">
                  {Object.entries(byCategory)
                    .map(([category, sum]) => `${category} ${formatWon(sum)}`)
                    .join(" · ")}
                </p>
              )}

              {monthExpenses.length === 0 && (
                <p className="text-sm text-ink-faint">이번 달 지출이 없습니다.</p>
              )}

              <ul className="divide-y divide-border text-sm">
                {monthExpenses.slice(0, 8).map((e) => (
                  <li key={e.id} className="group flex items-center justify-between py-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-xs text-ink-soft">
                        {e.category}
                      </span>
                      <span className="text-ink-soft">{e.memo}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-ink">
                        {formatWon(e.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs text-ink-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
                      >
                        삭제
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
