"use client";

import { useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import WidgetCard from "./WidgetCard";
import HoldingsForm from "./HoldingsForm";
import AiAlertPanel from "./AiAlertPanel";

function formatPercent(value: number | null) {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function percentColor(value: number | null) {
  if (value === null) return "text-zinc-400";
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-blue-500";
  return "text-zinc-500";
}

export default function PortfolioWidget() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManage, setShowManage] = useState(false);
  const { data, error } = usePortfolio(refreshKey);

  return (
    <WidgetCard title="포트폴리오" className="sm:col-span-2 lg:col-span-3">
      {error && !data && <p className="text-sm text-red-500">{error}</p>}
      {!error && !data && <p className="text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>}

      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 dark:text-zinc-500">
                  <th className="pb-2 font-normal">종목</th>
                  <th className="pb-2 font-normal">현재가</th>
                  <th className="pb-2 font-normal">평가금액</th>
                  <th className="pb-2 font-normal">수익률</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((h) => (
                  <tr key={h.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-2">
                      {h.name ?? h.symbol}
                      <span className="ml-1 text-xs text-zinc-400">
                        {h.asset_type === "crypto" ? "코인" : "주식"}
                      </span>
                    </td>
                    <td className="py-2 tabular-nums">
                      {h.price !== null ? h.price.toLocaleString() : h.error ?? "-"}
                    </td>
                    <td className="py-2 tabular-nums">
                      {h.marketValue !== null ? h.marketValue.toLocaleString() : "-"}
                    </td>
                    <td className={`py-2 tabular-nums ${percentColor(h.gainLossPercent)}`}>
                      {formatPercent(h.gainLossPercent)}
                    </td>
                  </tr>
                ))}
                {data.holdings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-400 dark:text-zinc-500">
                      보유 종목이 없습니다. 아래에서 추가해보세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data.totals.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {data.totals.map((t) => (
                <div key={t.currency}>
                  <span className="text-zinc-400 dark:text-zinc-500">{t.currency} 합계</span>{" "}
                  <span className="tabular-nums">{t.marketValue.toLocaleString()}</span>{" "}
                  <span className={`tabular-nums ${percentColor(t.gainLossPercent)}`}>
                    ({formatPercent(t.gainLossPercent)})
                  </span>
                </div>
              ))}
            </div>
          )}

          <AiAlertPanel />

          <button
            onClick={() => setShowManage((v) => !v)}
            className="mt-4 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            {showManage ? "종목 관리 닫기" : "보유 종목 관리"}
          </button>
          {showManage && (
            <HoldingsForm holdings={data.holdings} onChange={() => setRefreshKey((k) => k + 1)} />
          )}
        </>
      )}
    </WidgetCard>
  );
}
