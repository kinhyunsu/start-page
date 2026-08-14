"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { signInWithGoogle } from "@/lib/googleAuth";
import WidgetCard from "./WidgetCard";

type Article = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  game?: string;
  official?: boolean;
};

type Category = "politics" | "hot" | "games";

type CategoryState = {
  articles: Article[];
  error: string | null;
  gameNames?: string[];
};

const TABS: { key: Category; label: string }[] = [
  { key: "politics", label: "정치" },
  { key: "hot", label: "실시간 핫뉴스" },
  { key: "games", label: "게임 업데이트" },
];

const STORAGE_KEY = "dashboard-news-tab";
const MAX_GAMES = 5;

function timeAgo(pubDate: string) {
  const diffMs = Date.now() - new Date(pubDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function NewsWidget() {
  const user = useUser();
  const [tab, setTab] = useState<Category>("politics");
  const [cache, setCache] = useState<Partial<Record<Category, CategoryState>>>({});
  const [loading, setLoading] = useState(false);
  const [gameInput, setGameInput] = useState("");
  const [gameSubmitting, setGameSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Category | null;
    if (saved && TABS.some((t) => t.key === saved)) setTab(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, tab);
  }, [tab]);

  async function load(category: Category) {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${category}`);
      const json = await res.json();
      if (json.error) {
        setCache((c) => ({ ...c, [category]: { articles: [], error: json.error } }));
        return;
      }
      setCache((c) => ({
        ...c,
        [category]: { articles: json.articles ?? [], error: null, gameNames: json.games },
      }));
    } catch {
      setCache((c) => ({ ...c, [category]: { articles: [], error: "뉴스를 가져오지 못했습니다." } }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "games" && !user) return;
    if (!cache[tab]) load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user]);

  async function handleAddGame(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const name = gameInput.trim();
    if (!name || (cache.games?.gameNames?.length ?? 0) >= MAX_GAMES) return;
    setGameSubmitting(true);
    const supabase = createClient();
    await supabase.from("tracked_games").insert({ user_id: user.id, name });
    setGameInput("");
    setGameSubmitting(false);
    await load("games");
  }

  async function handleRemoveGame(name: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("tracked_games").delete().eq("user_id", user.id).eq("name", name);
    await load("games");
  }

  const current = cache[tab];
  const showContent = tab !== "games" || !!user;

  return (
    <WidgetCard title="뉴스" className="sm:col-span-2 lg:col-span-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-accent text-white" : "bg-accent-soft text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => load(tab)}
          disabled={loading || (tab === "games" && !user)}
          className="ml-auto text-xs font-medium text-ink-faint hover:text-accent disabled:opacity-40"
        >
          새로고침
        </button>
      </div>

      {tab === "games" && user === undefined && (
        <p className="text-sm text-ink-faint">불러오는 중...</p>
      )}

      {tab === "games" && user === null && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-ink-soft">게임 업데이트를 보려면 로그인이 필요합니다.</p>
          <button
            onClick={signInWithGoogle}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"
          >
            Google로 로그인
          </button>
        </div>
      )}

      {tab === "games" && user && (
        <p className="mb-2 text-xs text-ink-faint">
          스팀에 있는 게임은 <span className="rounded-full bg-accent px-1.5 py-0.5 text-white">공식</span> 배지와 함께 스팀 공식 소식이 표시돼요 (영문명으로 검색해야 잘 찾아져요). 스팀 밖 게임은 관련 뉴스로 대신 보여줘요.
        </p>
      )}

      {tab === "games" && user && (
        <form onSubmit={handleAddGame} className="mb-3 flex flex-wrap items-center gap-1.5">
          {(current?.gameNames ?? []).map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-ink"
            >
              {name}
              <button
                type="button"
                onClick={() => handleRemoveGame(name)}
                className="text-ink-faint hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
          {(current?.gameNames?.length ?? 0) < MAX_GAMES ? (
            <>
              <input
                value={gameInput}
                onChange={(e) => setGameInput(e.target.value)}
                placeholder="게임 이름 (스팀 게임은 영문명 추천)"
                className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-ink outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={gameSubmitting || !gameInput.trim()}
                className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-ink disabled:opacity-50"
              >
                추가
              </button>
            </>
          ) : (
            <span className="text-xs text-ink-faint">최대 {MAX_GAMES}개까지 등록할 수 있어요.</span>
          )}
        </form>
      )}

      {showContent && loading && !current && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {showContent && current?.error && <p className="text-sm text-ink-soft">{current.error}</p>}

      {showContent && current && !current.error && current.articles.length === 0 && (
        <p className="text-sm text-ink-faint">
          {tab === "games" ? "관심 게임을 추가해보세요." : "표시할 뉴스가 없습니다."}
        </p>
      )}

      {showContent && current && !current.error && current.articles.length > 0 && (
        <ul className="divide-y divide-border text-sm">
          {current.articles.map((a) => (
            <li key={a.link} className="py-2">
              <a
                href={a.link}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-ink hover:text-accent"
              >
                {a.title}
              </a>
              <p className="mt-0.5 text-xs text-ink-faint">
                {a.game && (
                  <span className="mr-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-ink-soft">
                    {a.game}
                  </span>
                )}
                {a.official && (
                  <span className="mr-1.5 rounded-full bg-accent px-1.5 py-0.5 text-white">
                    공식
                  </span>
                )}
                {a.source} · {timeAgo(a.pubDate)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
