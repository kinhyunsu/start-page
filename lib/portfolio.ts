export type Holding = {
  id: string;
  asset_type: "stock" | "crypto";
  symbol: string;
  name: string | null;
  quantity: number;
  avg_buy_price: number;
  currency: "KRW" | "USD";
};

export type PricedHolding = Holding & {
  price: number | null;
  error?: string;
  marketValue: number | null;
  gainLossAmount: number | null;
  gainLossPercent: number | null;
};

export function computeGainLoss(holding: Holding, price: number | null): PricedHolding {
  if (price === null) {
    return { ...holding, price: null, marketValue: null, gainLossAmount: null, gainLossPercent: null };
  }

  const marketValue = holding.quantity * price;
  const costBasis = holding.quantity * holding.avg_buy_price;
  const gainLossAmount = marketValue - costBasis;
  const gainLossPercent = costBasis > 0 ? (gainLossAmount / costBasis) * 100 : null;

  return { ...holding, price, marketValue, gainLossAmount, gainLossPercent };
}

export function aggregatePortfolio(rows: PricedHolding[]) {
  const totalsByCurrency: Record<string, { marketValue: number; costBasis: number }> = {};

  for (const row of rows) {
    if (row.marketValue === null) continue;
    const bucket = (totalsByCurrency[row.currency] ??= { marketValue: 0, costBasis: 0 });
    bucket.marketValue += row.marketValue;
    bucket.costBasis += row.quantity * row.avg_buy_price;
  }

  return Object.entries(totalsByCurrency).map(([currency, { marketValue, costBasis }]) => ({
    currency,
    marketValue,
    costBasis,
    gainLossAmount: marketValue - costBasis,
    gainLossPercent: costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : null,
  }));
}
