"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { signInWithGoogle } from "@/lib/googleAuth";
import WidgetCard from "./WidgetCard";

type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: "KRW" | "USD";
  billing_day: number;
};

const emptyForm = { name: "", price: "", currency: "KRW" as "KRW" | "USD", billing_day: "1" };

const fieldClass =
  "rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

type Preset = {
  name: string;
  price: number;
  currency: "KRW" | "USD";
  color: string;
  badge: string;
  logoSlug?: string; // simpleicons.org 슬러그 — 있으면 실제 브랜드 로고 사용
};

const PRESETS: Preset[] = [
  { name: "넷플릭스", price: 13500, currency: "KRW", color: "#E50914", badge: "N", logoSlug: "netflix" },
  {
    name: "유튜브 프리미엄",
    price: 14900,
    currency: "KRW",
    color: "#FF0000",
    badge: "Y",
    logoSlug: "youtube",
  },
  { name: "디즈니+", price: 9900, currency: "KRW", color: "#113CCF", badge: "D+" },
  { name: "쿠팡 와우", price: 7890, currency: "KRW", color: "#3689E6", badge: "C" },
  { name: "티빙", price: 9500, currency: "KRW", color: "#FF0031", badge: "T" },
];

const FALLBACK_COLORS = ["#6D5EF0", "#0EA5A5", "#E8873D", "#5B8DEF", "#C2418C", "#3FA05E"];

type Icon = { color: string; badge: string; logoUrl?: string };

function iconFor(name: string): Icon {
  const preset = PRESETS.find((p) => p.name === name.trim());
  if (preset) {
    return {
      color: preset.color,
      badge: preset.badge,
      logoUrl: preset.logoSlug ? `https://cdn.simpleicons.org/${preset.logoSlug}` : undefined,
    };
  }

  const trimmed = name.trim();
  const hash = Array.from(trimmed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const color = FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
  const badge = trimmed.charAt(0).toUpperCase() || "?";
  return { color, badge };
}

function IconBadge({ icon, size = 6 }: { icon: Icon; size?: number }) {
  const dimension = `${size * 0.25}rem`;
  if (icon.logoUrl) {
    return (
      <span
        style={{ width: dimension, height: dimension }}
        className="flex shrink-0 items-center justify-center rounded-full bg-white p-1 ring-1 ring-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon.logoUrl} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      style={{ backgroundColor: icon.color, width: dimension, height: dimension }}
      className="flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
    >
      {icon.badge}
    </span>
  );
}

function formatBillingLabel(date: Date, dLeft: number) {
  const md = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  if (dLeft === 0) return `오늘 결제 (${md})`;
  if (dLeft === 1) return `내일 결제 (${md})`;
  return `${md} 결제 · D-${dLeft}`;
}

function nextBillingDate(billingDay: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const clampedThis = Math.min(billingDay, daysInThisMonth);
  if (today <= clampedThis) return new Date(year, month, clampedThis);

  const daysInNextMonth = new Date(year, month + 2, 0).getDate();
  return new Date(year, month + 1, Math.min(billingDay, daysInNextMonth));
}

function daysUntil(date: Date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - startOfToday.getTime()) / 86400000);
}

function formatMoney(amount: number, currency: "KRW" | "USD") {
  const symbol = currency === "KRW" ? "₩" : "$";
  return `${symbol}${new Intl.NumberFormat("ko-KR").format(amount)}`;
}

export default function SubscriptionWidget() {
  const user = useUser();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("id, name, price, currency, billing_day")
      .order("billing_day", { ascending: true });
    setSubs(data ?? []);
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
    await supabase.from("subscriptions").insert({
      user_id: user.id,
      name: form.name.trim(),
      price: Number(form.price),
      currency: form.currency,
      billing_day: Number(form.billing_day),
    });
    setForm(emptyForm);
    setSubmitting(false);
    load();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("subscriptions").delete().eq("id", id);
    load();
  }

  const totals =
    subs?.reduce<Record<string, number>>((acc, s) => {
      acc[s.currency] = (acc[s.currency] ?? 0) + s.price;
      return acc;
    }, {}) ?? {};

  return (
    <WidgetCard title="구독 관리">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-ink-soft">구독 관리를 하려면 로그인이 필요합니다.</p>
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
          <div className="mb-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, name: p.name, price: String(p.price), currency: p.currency }))
                }
                className="flex items-center gap-1.5 rounded-full border border-border bg-bg px-2 py-1 text-xs text-ink-soft hover:border-accent hover:text-ink"
              >
                <IconBadge icon={iconFor(p.name)} size={4} />
                {p.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleAdd} className="mb-3 grid grid-cols-2 gap-1.5">
            <input
              required
              placeholder="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`${fieldClass} col-span-2`}
            />
            <input
              required
              type="number"
              min="0"
              step="any"
              placeholder="금액"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={`${fieldClass} font-mono`}
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as "KRW" | "USD" })}
              className={fieldClass}
            >
              <option value="KRW">KRW</option>
              <option value="USD">USD</option>
            </select>
            <input
              required
              type="number"
              min="1"
              max="31"
              placeholder="결제일(1~31)"
              value={form.billing_day}
              onChange={(e) => setForm({ ...form, billing_day: e.target.value })}
              className={`${fieldClass} font-mono`}
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
            >
              추가
            </button>
          </form>

          {subs === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

          {subs !== null && (
            <>
              {subs.length === 0 && <p className="text-sm text-ink-faint">등록된 구독이 없습니다.</p>}
              <ul className="divide-y divide-border text-sm">
                {subs.map((s) => {
                  const next = nextBillingDate(s.billing_day);
                  const dLeft = daysUntil(next);
                  const soon = dLeft <= 3;
                  const icon = iconFor(s.name);
                  return (
                    <li key={s.id} className="group flex items-start justify-between gap-2 py-2">
                      <span className="flex items-center gap-2">
                        <IconBadge icon={icon} size={7} />
                        <span>
                          <span className="block text-ink">{s.name}</span>
                          <span
                            className={`block text-xs ${
                              soon ? "font-semibold text-accent" : "text-ink-faint"
                            }`}
                          >
                            {formatBillingLabel(next, dLeft)}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs tabular-nums text-ink-soft">
                          {formatMoney(s.price, s.currency)}
                        </span>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-xs text-ink-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
                        >
                          삭제
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>

              {Object.keys(totals).length > 0 && (
                <p className="mt-2 text-xs text-ink-faint">
                  월 합계{" "}
                  {Object.entries(totals)
                    .map(([currency, sum]) => formatMoney(sum, currency as "KRW" | "USD"))
                    .join(" · ")}
                </p>
              )}
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
