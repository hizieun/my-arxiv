"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const authError = params.get("error");

  async function signInWithGitHub() {
    setLoading(true);
    const supabase = createClient();
    const next = params.get("next") ?? "/community";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setLoading(false);
    // 성공 시 GitHub로 리다이렉트되므로 별도 처리 불필요
  }

  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">로그인</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        학습 글을 쓰고 공유하려면 로그인하세요.
        <br />
        논문 탐색·노트는 로그인 없이도 이용할 수 있어요.
      </p>

      {authError && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">
          로그인에 실패했어요. 다시 시도해 주세요.
        </p>
      )}

      <button
        onClick={signInWithGitHub}
        disabled={loading}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--foreground)] px-4 py-3 font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden>
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
        {loading ? "이동 중…" : "GitHub로 로그인"}
      </button>
    </div>
  );
}
