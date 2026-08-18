"use client";

import { useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useUser } from "@/hooks/useUser";
import WidgetCard from "./WidgetCard";
import HoldingsForm from "./HoldingsForm";

function formatPercent(value: number | null) {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function percentColor(value: number | null) {
  if (value === null) return "text-ink-faint";
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-blue-500";
  return "text-ink-soft";
}

export default function PortfolioWidget() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManage, setShowManage] = useState(false);
  const user = useUser();
  const { data, error } = usePortfolio(refreshKey, !!user);

  return (
    <WidgetCard title="포트폴리오" className="sm:col-span-2 lg:col-span-3">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <p className="py-4 text-center text-sm text-ink-faint">로그인하면 이용할 수 있어요</p>
      )}

      {user && error && !data && <p className="text-sm text-red-500">{error}</p>}
      {user && !error && !data && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user && data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-faint">
                  <th className="pb-2 font-normal">종목</th>
                  <th className="pb-2 font-normal">현재가</th>
                  <th className="pb-2 font-normal">평가금액</th>
                  <th className="pb-2 font-normal">수익률</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((h) => (
                  <tr key={h.id} className="border-t border-border">
                    <td className="py-2 text-ink">
                      {h.name ?? h.symbol}
                      <span className="ml-1 text-xs text-ink-faint">
                        {h.asset_type === "crypto" ? "코인" : "주식"}
                      </span>
                    </td>
                    <td className="py-2 font-mono tabular-nums text-ink">
                      {h.price !== null ? h.price.toLocaleString() : h.error ?? "-"}
                    </td>
                    <td className="py-2 font-mono tabular-nums text-ink">
                      {h.marketValue !== null ? h.marketValue.toLocaleString() : "-"}
                    </td>
                    <td className={`py-2 font-mono tabular-nums ${percentColor(h.gainLossPercent)}`}>
                      {formatPercent(h.gainLossPercent)}
                    </td>
                  </tr>
                ))}
                {data.holdings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-ink-faint">
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
                  <span className="text-ink-faint">{t.currency} 합계</span>{" "}
                  <span className="font-mono tabular-nums text-ink">{t.marketValue.toLocaleString()}</span>{" "}
                  <span className={`font-mono tabular-nums ${percentColor(t.gainLossPercent)}`}>
                    ({formatPercent(t.gainLossPercent)})
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowManage((v) => !v)}
            className="mt-4 text-xs font-medium text-accent hover:text-accent-ink"
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
