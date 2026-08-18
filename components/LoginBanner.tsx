"use client";

import { useUser } from "@/hooks/useUser";
import { signInWithGoogle } from "@/lib/googleAuth";

export default function LoginBanner() {
  const user = useUser();

  if (user !== null) return null;

  return (
    <div className="border-b border-border bg-accent-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <p className="text-sm text-ink">
          캘린더·포트폴리오·루틴 같은 개인 위젯은 로그인 후 이용할 수 있어요.
        </p>
        <button
          onClick={signInWithGoogle}
          className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-ink"
        >
          Google로 로그인
        </button>
      </div>
    </div>
  );
}
