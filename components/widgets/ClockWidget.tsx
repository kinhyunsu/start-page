"use client";

import { useClock } from "@/hooks/useClock";
import WidgetCard from "./WidgetCard";

export default function ClockWidget() {
  const now = useClock();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <WidgetCard title="시계">
      {now ? (
        <div>
          <p className="font-mono text-4xl font-semibold tabular-nums text-ink">
            {now.toLocaleTimeString("ko-KR", { hour12: false })}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {now.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
          <p className="mt-1 text-xs text-ink-faint">{timeZone}</p>
        </div>
      ) : (
        <p className="font-mono text-4xl font-semibold text-ink-faint">--:--:--</p>
      )}
    </WidgetCard>
  );
}
