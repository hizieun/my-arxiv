"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/search", label: "Search" },
  { href: "/categories", label: "Categories" },
  { href: "/notes", label: "Notes" },
  { href: "/community", label: "Community" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null); // null = 미확정

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
      setUsername(data?.username ?? null);
    }

    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      if (data.user) loadProfile(data.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
      if (session?.user) loadProfile(session.user.id);
      else setUsername(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight">
          📚 <span className="font-bold">my-arxiv</span>
        </Link>

        {/* 링크: 좁은 화면에선 가로 스크롤(스크롤바 숨김)로 오버플로우 방지 */}
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "shrink-0 rounded-md px-2.5 py-1.5 transition-colors sm:px-3",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 인증: 항상 우측 고정 */}
        <div className="flex shrink-0 items-center gap-1 text-sm">
          {authed ? (
            <>
              {username && (
                <Link
                  href={`/u/${username}`}
                  className="hidden max-w-[8rem] truncate px-1 text-[var(--muted)] hover:text-[var(--foreground)] sm:inline"
                  title={`@${username}`}
                >
                  @{username}
                </Link>
              )}
              <button
                onClick={signOut}
                className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
