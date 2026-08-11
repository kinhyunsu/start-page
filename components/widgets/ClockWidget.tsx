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
          <p className="font-mono text-4xl font-semibold tabular-nums">
            {now.toLocaleTimeString("ko-KR", { hour12: false })}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {now.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{timeZone}</p>
        </div>
      ) : (
        <p className="text-4xl font-semibold text-zinc-300 dark:text-zinc-700">--:--:--</p>
      )}
    </WidgetCard>
  );
}
