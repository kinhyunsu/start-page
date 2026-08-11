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
        setError(json.error ?? "코멘트 생성에 실패했습니다.");
        return;
      }
      setSummary(json.summary);
    } catch {
      setError("코멘트 생성에 실패했습니다.");
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
        {loading ? "생성 중..." : summary ? "오늘의 AI 코멘트 다시보기" : "오늘의 AI 코멘트 보기"}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {summary && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>}
    </div>
  );
}
