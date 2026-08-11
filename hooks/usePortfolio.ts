"use client";

import { useEffect, useState } from "react";
import type { PricedHolding } from "@/lib/portfolio";

const CACHE_KEY = "dashboard-portfolio";
const REFRESH_INTERVAL_MS = 60 * 1000;

export type PortfolioTotal = {
  currency: string;
  marketValue: number;
  costBasis: number;
  gainLossAmount: number;
  gainLossPercent: number | null;
};

type PortfolioResponse = {
  holdings: PricedHolding[];
  totals: PortfolioTotal[];
  generatedAt: string;
};

export function usePortfolio(refreshKey: number, enabled: boolean) {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch {
        // ignore malformed cache
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/portfolio");
        if (!res.ok) throw new Error("포트폴리오를 불러오지 못했습니다.");
        const json: PortfolioResponse = await res.json();
        if (cancelled) return;
        setData(json);
        setError(null);
        localStorage.setItem(CACHE_KEY, JSON.stringify(json));
      } catch {
        if (!cancelled) setError("포트폴리오를 불러오지 못했습니다.");
      }
    }

    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshKey, enabled]);

  return { data, error };
}
