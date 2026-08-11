import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchUpbitTickers } from "@/lib/upbit";
import { fetchKisPrice, isKisConfigured } from "@/lib/kis";
import { aggregatePortfolio, computeGainLoss, type Holding, type PricedHolding } from "@/lib/portfolio";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: holdings, error } = await supabase
    .from("holdings")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "보유 종목을 불러오지 못했습니다." }, { status: 500 });
  }

  const rows = (holdings ?? []) as Holding[];
  const cryptoRows = rows.filter((h) => h.asset_type === "crypto");
  const stockRows = rows.filter((h) => h.asset_type === "stock");

  const priced: PricedHolding[] = [];

  if (cryptoRows.length > 0) {
    try {
      const tickers = await fetchUpbitTickers(cryptoRows.map((h) => h.symbol));
      for (const holding of cryptoRows) {
        const ticker = tickers.get(holding.symbol);
        const result = computeGainLoss(holding, ticker?.trade_price ?? null);
        if (!ticker) result.error = "업비트 시세 조회 실패";
        priced.push(result);
      }
    } catch {
      for (const holding of cryptoRows) {
        priced.push({ ...computeGainLoss(holding, null), error: "업비트 시세 조회 실패" });
      }
    }
  }

  if (stockRows.length > 0) {
    if (!isKisConfigured()) {
      for (const holding of stockRows) {
        priced.push({ ...computeGainLoss(holding, null), error: "설정 필요 (KIS API 키 없음)" });
      }
    } else {
      const results = await Promise.allSettled(stockRows.map((h) => fetchKisPrice(h.symbol)));
      results.forEach((result, i) => {
        const holding = stockRows[i];
        if (result.status === "fulfilled") {
          priced.push(computeGainLoss(holding, result.value));
        } else {
          priced.push({ ...computeGainLoss(holding, null), error: "KIS API 인증 실패" });
        }
      });
    }
  }

  return NextResponse.json({
    holdings: priced,
    totals: aggregatePortfolio(priced),
    generatedAt: new Date().toISOString(),
  });
}
