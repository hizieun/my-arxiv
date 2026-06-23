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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          📚 <span className="font-bold">my-arxiv</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "rounded-md px-3 py-1.5 transition-colors",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}

          <span className="mx-1 h-4 w-px bg-[var(--border)]" aria-hidden />

          {authed ? (
            <>
              <span className="px-2 text-[var(--muted)]">
                {username ? `@${username}` : "…"}
              </span>
              <button
                onClick={signOut}
                className="rounded-md px-3 py-1.5 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
