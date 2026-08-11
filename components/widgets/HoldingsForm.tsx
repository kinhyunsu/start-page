"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchUpbitMarkets, type UpbitMarket } from "@/lib/upbit";
import type { PricedHolding } from "@/lib/portfolio";

type HoldingsFormProps = {
  holdings: PricedHolding[];
  onChange: () => void;
};

const emptyForm = {
  asset_type: "crypto" as "crypto" | "stock",
  symbol: "",
  name: "",
  quantity: "",
  avg_buy_price: "",
  currency: "KRW" as "KRW" | "USD",
};

const MARKETS_CACHE_KEY = "dashboard-upbit-markets";
const MARKETS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default function HoldingsForm({ holdings, onChange }: HoldingsFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [markets, setMarkets] = useState<UpbitMarket[]>([]);
  const [marketsError, setMarketsError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(MARKETS_CACHE_KEY);
    if (cached) {
      try {
        const { markets: cachedMarkets, fetchedAt } = JSON.parse(cached);
        if (Date.now() - fetchedAt < MARKETS_CACHE_TTL_MS) {
          setMarkets(cachedMarkets);
          return;
        }
      } catch {
        // ignore malformed cache
      }
    }

    fetchUpbitMarkets()
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.korean_name.localeCompare(b.korean_name, "ko"));
        setMarkets(sorted);
        localStorage.setItem(
          MARKETS_CACHE_KEY,
          JSON.stringify({ markets: sorted, fetchedAt: Date.now() })
        );
      })
      .catch(() => setMarketsError("코인 목록을 가져오지 못했습니다."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from("holdings").insert({
      asset_type: form.asset_type,
      symbol: form.symbol.trim(),
      name: form.name.trim() || null,
      quantity: Number(form.quantity),
      avg_buy_price: Number(form.avg_buy_price),
      currency: form.currency,
    });
    setForm(emptyForm);
    setSubmitting(false);
    onChange();
  }

  async function handleDelete(id: string) {
    await supabase.from("holdings").delete().eq("id", id);
    onChange();
  }

  function handleCoinSelect(market: string) {
    const selected = markets.find((m) => m.market === market);
    setForm({ ...form, symbol: market, name: selected?.korean_name ?? form.name });
  }

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
        <select
          value={form.asset_type}
          onChange={(e) =>
            setForm({ ...emptyForm, asset_type: e.target.value as "crypto" | "stock" })
          }
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="crypto">코인</option>
          <option value="stock">주식</option>
        </select>

        {form.asset_type === "crypto" ? (
          <select
            required
            value={form.symbol}
            onChange={(e) => handleCoinSelect(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="" disabled>
              {marketsError ?? (markets.length === 0 ? "불러오는 중..." : "코인 선택")}
            </option>
            {markets.map((m) => (
              <option key={m.market} value={m.market}>
                {m.korean_name} ({m.market.replace("KRW-", "")})
              </option>
            ))}
          </select>
        ) : (
          <input
            required
            placeholder="005930"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        )}

        <input
          placeholder="종목명(선택)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <input
          required
          type="number"
          step="any"
          placeholder="수량"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <input
          required
          type="number"
          step="any"
          placeholder="평균매입가"
          value={form.avg_buy_price}
          onChange={(e) => setForm({ ...form, avg_buy_price: e.target.value })}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          추가
        </button>
      </form>

      <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
        {holdings.map((h) => (
          <li key={h.id} className="flex items-center justify-between py-1.5">
            <span>
              {h.asset_type === "crypto" ? "코인" : "주식"} · {h.symbol} · {h.quantity}주/개 @ {h.avg_buy_price}
            </span>
            <button
              onClick={() => handleDelete(h.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              삭제
            </button>
          </li>
        ))}
        {holdings.length === 0 && (
          <li className="py-1.5 text-zinc-400 dark:text-zinc-500">등록된 종목이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
