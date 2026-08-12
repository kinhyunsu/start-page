"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase-browser";
import { resizeImage } from "@/lib/resizeImage";
import WidgetCard from "./WidgetCard";

const BUCKET = "dashboard-photos";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function PhotoWidget() {
  const user = useUser();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${user.id}/photo`);
    setPhotoUrl(`${data.publicUrl}?t=${Date.now()}`);
  }, [user]);

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

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(`${user.id}/photo`, resized, { upsert: true, contentType: resized.type });

    setUploading(false);
    if (uploadError) {
      setError("업로드에 실패했습니다.");
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${user.id}/photo`);
    setPhotoUrl(`${data.publicUrl}?t=${Date.now()}`);
    setHasPhoto(true);
  }

  async function handleDelete() {
    if (!user) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([`${user.id}/photo`]);
    setHasPhoto(false);
  }

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <WidgetCard title="사진" className="overflow-hidden">
      {user === undefined && <p className="text-sm text-ink-faint">불러오는 중...</p>}

      {user === null && (
        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-ink-soft">사진을 꾸미려면 로그인이 필요합니다.</p>
          <button
            onClick={signIn}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"
          >
            Google로 로그인
          </button>
        </div>
      )}

      {user && hasPhoto !== false && photoUrl && (
        <div className="group relative -mx-5 -mb-5 mt-1 aspect-square bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="내 사진"
            className="h-full w-full object-contain"
            onLoad={() => setHasPhoto(true)}
            onError={() => setHasPhoto(false)}
          />
          {hasPhoto && (
            <div className="absolute inset-0 flex items-end justify-end gap-2 bg-black/0 p-3 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
              <button
                onClick={() => inputRef.current?.click()}
                className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink hover:bg-white"
              >
                변경
              </button>
              <button
                onClick={handleDelete}
                className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-red-600 hover:bg-white"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      {user && hasPhoto === false && (
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
