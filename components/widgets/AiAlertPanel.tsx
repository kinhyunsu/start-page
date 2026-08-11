"use client";

import { useEffect, useState } from "react";

export default function AiAlertPanel() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai-alert")
      .then((res) => res.json())
      .then((json) => {
        if (json.cached) setSummary(json.summary);
      })
      .catch(() => {});
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-alert", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "뉴스 요약 생성에 실패했습니다.");
        return;
      }
      setSummary(json.summary);
    } catch {
      setError("뉴스 요약 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <button
        onClick={generate}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {loading
          ? "관련 뉴스 검색 중... (최대 1분 소요)"
          : summary
            ? "보유 종목 관련 뉴스 다시보기"
            : "보유 종목 관련 뉴스 보기"}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {summary && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>
      )}
    </div>
  );
}
