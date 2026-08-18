"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import WidgetCard from "./WidgetCard";

type Bookmark = { id: string; name: string; url: string };

function faviconUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
  } catch {
    return "";
  }
}

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const emptyForm = { name: "", url: "" };

export default function BookmarkWidget() {
  const user = useUser();
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("bookmarks")
      .select("id, name, url")
      .order("created_at", { ascending: true });
    if (loadError) {
      setError("즐겨찾기를 불러오지 못했습니다. Supabase에 bookmarks 테이블이 있는지 확인해주세요.");
      setBookmarks([]);
      return;
    }
    setError(null);
    setBookmarks(data ?? []);
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name.trim() || !form.url.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      name: form.name.trim(),
      url: normalizeUrl(form.url),
    });
    setSubmitting(false);
    if (insertError) {
      setError("추가에 실패했습니다: " + insertError.message);
      return;
    }
    setForm(emptyForm);
    setShowAdd(false);
    load();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("bookmarks").delete().eq("id", id);
    load();
  }

  return (
    <WidgetCard title="즐겨찾기">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <p className="py-4 text-center text-sm text-ink-faint">로그인하면 이용할 수 있어요</p>
      )}

      {user && (
        <>
          {error && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-500">{error}</p>
          )}

          {bookmarks === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

          {bookmarks !== null && (
            <div className="grid grid-cols-4 gap-2">
              {bookmarks.map((b) => (
                <div key={b.id} className="group relative flex flex-col items-center gap-1">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg hover:border-accent"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={faviconUrl(b.url)} alt="" className="h-5 w-5" />
                  </a>
                  <span className="w-full truncate text-center text-[10px] text-ink-faint">
                    {b.name}
                  </span>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={() => setShowAdd((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border text-ink-faint hover:border-accent hover:text-accent"
                aria-label="즐겨찾기 추가"
              >
                +
              </button>
            </div>
          )}

          {showAdd && (
            <form
              onSubmit={handleAdd}
              className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3"
            >
              <input
                required
                placeholder="이름 (예: 유튜브)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              />
              <input
                required
                placeholder="주소 (예: youtube.com)"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
              >
                추가
              </button>
            </form>
          )}
        </>
      )}
    </WidgetCard>
  );
}
