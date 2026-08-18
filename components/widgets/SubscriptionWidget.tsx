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

type ServiceInfo = {
  name: string;
  price: number;
  currency: "KRW" | "USD";
  color: string;
  badge: string;
  logoSlug?: string; // simpleicons.org 슬러그 — 있으면 실제 브랜드 로고 사용
};

// logoSlug가 있는 건 simpleicons.org에 실제 로고가 있는 것만 (무료 오픈소스 아이콘셋이라
// 한국 특화 서비스는 대부분 없음 — 그런 경우는 브랜드 색상 배지로 대신 표시한다.
const SERVICES: ServiceInfo[] = [
  { name: "넷플릭스", price: 13500, currency: "KRW", color: "#E50914", badge: "N", logoSlug: "netflix" },
  { name: "유튜브 프리미엄", price: 14900, currency: "KRW", color: "#FF0000", badge: "Y", logoSlug: "youtube" },
  { name: "디즈니+", price: 9900, currency: "KRW", color: "#113CCF", badge: "D+" },
  { name: "티빙", price: 9500, currency: "KRW", color: "#FF0031", badge: "T" },
  { name: "웨이브", price: 7900, currency: "KRW", color: "#1AA5FF", badge: "W" },
  { name: "왓챠", price: 7900, currency: "KRW", color: "#FF0558", badge: "왓" },
  { name: "멜론", price: 10900, currency: "KRW", color: "#00CD3C", badge: "M" },
  { name: "지니뮤직", price: 10900, currency: "KRW", color: "#1E9AE2", badge: "G" },
  { name: "배민클럽", price: 3990, currency: "KRW", color: "#2AC1BC", badge: "B" },
  { name: "쿠팡 와우", price: 7890, currency: "KRW", color: "#3689E6", badge: "C" },
  { name: "네이버플러스", price: 4900, currency: "KRW", color: "#03C75A", badge: "N", logoSlug: "naver" },
  { name: "스포티파이", price: 11900, currency: "KRW", color: "#1ED760", badge: "S", logoSlug: "spotify" },
];

const FALLBACK_COLORS = ["#6D5EF0", "#0EA5A5", "#E8873D", "#5B8DEF", "#C2418C", "#3FA05E"];

type Icon = { color: string; badge: string; logoUrl?: string };

function iconFor(name: string): Icon {
  const match = SERVICES.find((p) => p.name === name.trim());
  if (match) {
    return {
      color: match.color,
      badge: match.badge,
      logoUrl: match.logoSlug ? `https://cdn.simpleicons.org/${match.logoSlug}` : undefined,
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

type SubWithSchedule = Subscription & { next: Date; dLeft: number };

function SubRow({ sub, onDelete }: { sub: SubWithSchedule; onDelete: (id: string) => void }) {
  const soon = sub.dLeft <= 3;
  const icon = iconFor(sub.name);
  return (
    <li className="group flex items-start justify-between gap-2 py-2">
      <span className="flex items-center gap-2">
        <IconBadge icon={icon} size={7} />
        <span>
          <span className="block text-ink">{sub.name}</span>
          <span className={`block text-xs ${soon ? "font-semibold text-accent" : "text-ink-faint"}`}>
            {formatBillingLabel(sub.next, sub.dLeft)}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-ink-soft">
          {formatMoney(sub.price, sub.currency)}
        </span>
        <button
          onClick={() => onDelete(sub.id)}
          className="text-xs text-ink-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
        >
          삭제
        </button>
      </span>
    </li>
  );
}

const PREVIEW_COUNT = 3;

export default function SubscriptionWidget() {
  const user = useUser();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("subscriptions")
      .select("id, name, price, currency, billing_day")
      .order("billing_day", { ascending: true });
    if (loadError) {
      setError("구독 목록을 불러오지 못했습니다. Supabase에 subscriptions 테이블이 있는지 확인해주세요.");
      setSubs([]);
      return;
    }
    setError(null);
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
    const { error: insertError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      name: form.name.trim(),
      price: Number(form.price),
      currency: form.currency,
      billing_day: Number(form.billing_day),
    });
    setSubmitting(false);
    if (insertError) {
      setError("추가에 실패했습니다: " + insertError.message);
      return;
    }
    setForm(emptyForm);
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

  const scheduled: SubWithSchedule[] = (subs ?? [])
    .map((s) => {
      const next = nextBillingDate(s.billing_day);
      return { ...s, next, dLeft: daysUntil(next) };
    })
    .sort((a, b) => a.dLeft - b.dLeft);

  const preview = scheduled.slice(0, PREVIEW_COUNT);
  const hiddenCount = scheduled.length - preview.length;

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
          <p className="mb-1.5 text-xs text-ink-faint">자주 쓰는 구독 — 클릭하면 아래 입력칸에 채워져요</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SERVICES.map((p) => (
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

          {error && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-500">{error}</p>
          )}

          <form onSubmit={handleAdd} className="mb-3 grid grid-cols-2 gap-2">
            <label className="col-span-2 flex flex-col gap-0.5 text-xs text-ink-faint">
              구독 이름 (목록에 없으면 직접 입력)
              <input
                required
                placeholder="예: 배달의민족, 리디셀렉트..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-xs text-ink-faint">
              월 금액
              <input
                required
                type="number"
                min="0"
                step="any"
                placeholder="9900"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={`${fieldClass} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-xs text-ink-faint">
              통화
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value as "KRW" | "USD" })}
                className={fieldClass}
              >
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD (달러)</option>
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-0.5 text-xs text-ink-faint">
              매월 결제일 (1~31일 중 하루)
              <input
                required
                type="number"
                min="1"
                max="31"
                placeholder="예: 15"
                value={form.billing_day}
                onChange={(e) => setForm({ ...form, billing_day: e.target.value })}
                className={`${fieldClass} font-mono`}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="col-span-2 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
            >
              구독 추가
            </button>
          </form>

          {subs === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

          {subs !== null && (
            <>
              {!error && subs.length === 0 && (
                <p className="text-sm text-ink-faint">등록된 구독이 없습니다.</p>
              )}

              {scheduled.length > 0 && (
                <p className="mb-1 text-xs text-ink-faint">
                  총 {scheduled.length}개 구독 · 다음 결제:{" "}
                  <span className="font-medium text-ink-soft">{scheduled[0].name}</span> (
                  {formatBillingLabel(scheduled[0].next, scheduled[0].dLeft)})
                </p>
              )}

              <ul className="divide-y divide-border text-sm">
                {preview.map((s) => (
                  <SubRow key={s.id} sub={s} onDelete={handleDelete} />
                ))}
              </ul>

              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-1 text-xs font-medium text-accent hover:text-accent-ink"
                >
                  {hiddenCount}개 더보기
                </button>
              )}

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

      {showAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowAll(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">전체 구독 ({scheduled.length})</h3>
              <button
                onClick={() => setShowAll(false)}
                className="text-ink-faint hover:text-ink"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <ul className="divide-y divide-border text-sm">
              {scheduled.map((s) => (
                <SubRow key={s.id} sub={s} onDelete={handleDelete} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
