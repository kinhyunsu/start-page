import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchUpbitTickers } from "@/lib/upbit";
import { fetchKisPrice, isKisConfigured } from "@/lib/kis";
import { computeGainLoss, type Holding, type PricedHolding } from "@/lib/portfolio";
import { generateHoldingsNewsDigest, isAnthropicConfigured } from "@/lib/anthropic";

function todayKstDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

async function getPricedHoldings(): Promise<PricedHolding[]> {
  const { data: holdings } = await supabase.from("holdings").select("*");
  const rows = (holdings ?? []) as Holding[];
  const cryptoRows = rows.filter((h) => h.asset_type === "crypto");
  const stockRows = rows.filter((h) => h.asset_type === "stock");
  const priced: PricedHolding[] = [];

  if (cryptoRows.length > 0) {
    const tickers = await fetchUpbitTickers(cryptoRows.map((h) => h.symbol));
    for (const holding of cryptoRows) {
      priced.push(computeGainLoss(holding, tickers.get(holding.symbol)?.trade_price ?? null));
    }
  }

  if (stockRows.length > 0 && isKisConfigured()) {
    const results = await Promise.allSettled(stockRows.map((h) => fetchKisPrice(h.symbol)));
    results.forEach((result, i) => {
      priced.push(computeGainLoss(stockRows[i], result.status === "fulfilled" ? result.value : null));
    });
  }

  return priced;
}

export async function GET() {
  const { data } = await supabase
    .from("ai_alerts")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data && data.generated_at.slice(0, 10) === todayKstDateString()) {
    return NextResponse.json({ summary: data.summary, generatedAt: data.generated_at, cached: true });
  }

  return NextResponse.json({ summary: null, generatedAt: null, cached: false });
}

export async function POST() {
  if (!isAnthropicConfigured()) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("ai_alerts")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.generated_at.slice(0, 10) === todayKstDateString()) {
    return NextResponse.json({ summary: existing.summary, generatedAt: existing.generated_at, cached: true });
  }

  const holdings = await getPricedHoldings();
  if (holdings.length === 0) {
    return NextResponse.json({ error: "보유 종목이 없습니다." }, { status: 400 });
  }

  const summary = await generateHoldingsNewsDigest(holdings);
  const { data: inserted, error } = await supabase
    .from("ai_alerts")
    .insert({ summary })
    .select()
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "코멘트 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ summary: inserted.summary, generatedAt: inserted.generated_at, cached: false });
}
