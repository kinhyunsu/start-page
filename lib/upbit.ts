export type UpbitTicker = {
  market: string;
  trade_price: number;
  signed_change_rate: number;
  signed_change_price: number;
  prev_closing_price: number;
};

export type UpbitMarket = {
  market: string; // e.g. "KRW-BTC"
  korean_name: string;
  english_name: string;
};

export async function fetchUpbitMarkets(): Promise<UpbitMarket[]> {
  const res = await fetch("https://api.upbit.com/v1/market/all?is_details=false", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("업비트 마켓 목록을 가져오지 못했습니다.");

  const data: UpbitMarket[] = await res.json();
  return data.filter((m) => m.market.startsWith("KRW-"));
}

export async function fetchUpbitTickers(markets: string[]): Promise<Map<string, UpbitTicker>> {
  if (markets.length === 0) return new Map();

  const url = `https://api.upbit.com/v1/ticker?markets=${markets.join(",")}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("업비트 시세를 가져오지 못했습니다.");

  const data: UpbitTicker[] = await res.json();
  return new Map(data.map((t) => [t.market, t]));
}
