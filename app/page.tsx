"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PaperCard } from "@/components/PaperCard";
import { DEFAULT_SELECTED_CATEGORIES } from "@/lib/categories";
import { getCategories, STORAGE_EVENT } from "@/lib/storage";
import type { Paper } from "@/lib/types";

type Window = "week" | "month" | "all";

export default function FeedPage() {
  const [categories, setCats] = useState<string[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [windowKey, setWindowKey] = useState<Window>("week");
  const [hydrated, setHydrated] = useState(false);

  const loadCats = useCallback(() => {
    setCats(getCategories(DEFAULT_SELECTED_CATEGORIES));
  }, []);

  useEffect(() => {
    loadCats();
    setHydrated(true);
    const handler = () => loadCats();
    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  }, [loadCats]);

  useEffect(() => {
    if (!hydrated) return;
    if (categories.length === 0) {
      setPapers([]);
      return;
    }
    setStatus("loading");
    const params = new URLSearchParams({ categories: categories.join(",") });
    fetch(`/api/feed?${params}`)
      .then((r) => r.json())
      .then((data: { papers: Paper[]; error?: string }) => {
        setPapers(data.papers ?? []);
        setStatus(data.error ? "error" : "idle");
      })
      .catch(() => setStatus("error"));
  }, [categories, hydrated]);

  const filtered = papers.filter((p) => withinWindow(p.publishedAt, windowKey));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">신규 논문 피드</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {hydrated && categories.length > 0
              ? `${categories.join(", ")} · ${labelForWindow(windowKey)}`
              : "관심 카테고리를 먼저 선택하세요"}
          </p>
        </div>
        <div className="inline-flex rounded-md border border-[var(--border)] p-1 text-xs">
          {(["week", "month", "all"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindowKey(w)}
              className={[
                "rounded px-2.5 py-1 font-medium transition-colors",
                windowKey === w
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]",
              ].join(" ")}
            >
              {labelForWindow(w)}
            </button>
          ))}
        </div>
      </header>

      {hydrated && categories.length === 0 && (
        <EmptyState
          title="관심 카테고리가 없습니다"
          body="카테고리를 한 개 이상 선택해 주세요."
          cta={{ href: "/categories", label: "카테고리 설정으로" }}
        />
      )}

      {status === "loading" && <SkeletonList />}

      {status === "error" && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          arXiv를 가져오는 중 오류가 발생했어요. 잠시 후 새로고침해 주세요.
        </p>
      )}

      {status === "idle" && filtered.length === 0 && categories.length > 0 && (
        <EmptyState
          title={`${labelForWindow(windowKey)} 신규 논문이 없습니다`}
          body="더 넓은 기간으로 바꾸거나, 카테고리를 추가해 보세요."
        />
      )}

      <div className="grid gap-3">
        {filtered.map((p) => (
          <PaperCard key={p.id} paper={p} />
        ))}
      </div>
    </div>
  );
}

function withinWindow(iso: string, w: Window): boolean {
  if (w === "all") return true;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return false;
  const now = Date.now();
  const days = w === "week" ? 7 : 30;
  return now - d <= days * 24 * 60 * 60 * 1000;
}

function labelForWindow(w: Window): string {
  return w === "week" ? "이번 주" : w === "month" ? "최근 30일" : "전체";
}

function SkeletonList() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--card)]"
        />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
