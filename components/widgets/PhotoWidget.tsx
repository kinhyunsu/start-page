"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { resizeImage } from "@/lib/resizeImage";
import WidgetCard from "./WidgetCard";

const BUCKET = "dashboard-photos";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;
const SLIDE_INTERVAL_MS = 4000;

type Photo = { path: string; url: string };

export default function PhotoWidget() {
  const user = useUser();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    if (!user) return null;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(user.id, { sortBy: { column: "created_at", order: "asc" } });
    const list = (data ?? []).map((f) => {
      const path = `${user.id}/${f.name}`;
      return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
    });
    setPhotos(list);
    setIndex((i) => (i >= list.length ? 0 : i));
    return list;
  }, [user]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    if (!photos || photos.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [photos]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("5MB 이하 이미지만 업로드할 수 있습니다.");
      return;
    }
    if ((photos?.length ?? 0) >= MAX_PHOTOS) {
      setError(`사진은 최대 ${MAX_PHOTOS}장까지 추가할 수 있습니다.`);
      return;
    }

    setUploading(true);
    setError(null);

    let resized: Blob;
    try {
      resized = await resizeImage(file);
    } catch {
      setUploading(false);
      setError("이미지를 처리하지 못했습니다.");
      return;
    }

    const ext = resized.type === "image/png" ? "png" : "jpg";
    const name = `${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(`${user.id}/${name}`, resized, { contentType: resized.type });

    setUploading(false);
    if (uploadError) {
      setError("업로드에 실패했습니다.");
      return;
    }

    const previousCount = photos?.length ?? 0;
    await loadPhotos();
    setIndex(previousCount);
  }

  async function handleDeleteCurrent() {
    if (!user || !photos || photos.length === 0) return;
    const target = photos[index];
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([target.path]);
    await loadPhotos();
  }

  const showingPhoto = !!(user && photos && photos.length > 0);
  const current = showingPhoto ? photos![index] : null;

  return (
    <WidgetCard title="사진" className="overflow-hidden" hideTitle={showingPhoto}>
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <p className="py-4 text-center text-sm text-ink-faint">로그인하면 이용할 수 있어요</p>
      )}

      {user && photos === null && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user && current && (
        <div className="group absolute inset-0 bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt="내 사진" className="h-full w-full object-contain" />

          {error && (
            <p className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              {error}
            </p>
          )}

          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-black/0 p-3 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink hover:bg-white disabled:opacity-50"
            >
              추가
            </button>
            <button
              onClick={handleDeleteCurrent}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-red-600 hover:bg-white"
            >
              삭제
            </button>
          </div>

          {photos!.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {photos!.map((p, i) => (
                <button
                  key={p.path}
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}번째 사진`}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === index ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {user && photos && photos.length === 0 && (
        <div className="py-8 text-center">
          <p className="mb-3 text-sm text-ink-soft">
            {uploading ? "업로드 중..." : "원하는 사진으로 이 칸을 꾸며보세요."}
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-50"
          >
            사진 추가
          </button>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      )}

      {user && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </WidgetCard>
  );
}
