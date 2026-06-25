"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaperCard } from "@/components/PaperCard";
import { useFeedKeyboard } from "@/lib/useFeedKeyboard";
import { dedupAndSort } from "@/lib/aggregator";
import { DEFAULT_SELECTED_CATEGORIES } from "@/lib/categories";
import { getFeedCache, setFeedCache, useCategories, useHydrated } from "@/lib/storage";
import type { Paper } from "@/lib/types";

type Window = "week" | "month" | "all";
type SortKey = "recent" | "popular";
type SourceState = "loading" | "ready" | "error";
type SourceResult = { key: string; papers: Paper[]; state: SourceState };

const EMPTY_PAPERS: Paper[] = [];

export default function FeedPage() {
  const categories = useCategories(DEFAULT_SELECTED_CATEGORIES);
  const hydrated = useHydrated();
  const [windowKey, setWindowKey] = useState<Window>("week");
  const [sort, setSort] = useState<SortKey>("recent");

  // Fetch results are tagged with the cache key they belong to and are only set
  // inside async callbacks (never synchronously in an effect). Loading state and
  // the "showing cache" flag are derived during render — so no setState-in-effect.
  const [arxivFetched, setArxivFetched] = useState<SourceResult | null>(null);
  const [hfFetched, setHfFetched] = useState<SourceResult | null>(null);

  const cacheKey = useMemo(
    () => `cats=${[...categories].sort().join(",")}`,
    [categories],
  );

  // sessionStorage cache, read during render for instant paint (post-hydration
  // only, so SSR markup matches). Reading sessionStorage is pure per the lint
  // rules; we no longer compute freshness here (Date.now would be impure).
  const cachedEntry = useMemo(
    () => (hydrated ? getFeedCache(cacheKey) : null),
    [hydrated, cacheKey],
  );
  const cachedArxiv = useMemo(
    () => cachedEntry?.papers.filter((p) => p.source === "arxiv") ?? EMPTY_PAPERS,
    [cachedEntry],
  );
  const cachedHf = useMemo(
    () => cachedEntry?.papers.filter((p) => p.source !== "arxiv") ?? EMPTY_PAPERS,
    [cachedEntry],
  );

  const arxivCur = arxivFetched?.key === cacheKey ? arxivFetched : null;
  const hfCur = hfFetched?.key === cacheKey ? hfFetched : null;
  const noArxiv = categories.length === 0;

  const arxivPapers = noArxiv ? EMPTY_PAPERS : arxivCur?.papers ?? cachedArxiv;
  const hfPapers = hfCur?.papers ?? cachedHf;
  const arxivState: SourceState = noArxiv ? "ready" : arxivCur?.state ?? "loading";
  const hfState: SourceState = hfCur?.state ?? "loading";
  // Showing cached papers while a fresh fetch is still in flight for this key.
  const usingCache =
    (hfCur == null && cachedHf.length > 0) ||
    (!noArxiv && arxivCur == null && cachedArxiv.length > 0);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const key = cacheKey;

    fetch(`/api/feed?source=hf`)
      .then((r) => r.json())
      .then((data: { papers: Paper[]; errors?: string[] }) => {
        if (cancelled) return;
        setHfFetched({ key, papers: data.papers ?? [], state: data.errors?.length ? "error" : "ready" });
      })
      .catch(() => {
        if (cancelled) return;
        const c = getFeedCache(key); // keep cached papers visible on failure
        setHfFetched({ key, papers: c ? c.papers.filter((p) => p.source !== "arxiv") : [], state: "error" });
      });

    if (categories.length > 0) {
      const params = new URLSearchParams({ source: "arxiv", categories: categories.join(",") });
      fetch(`/api/feed?${params}`)
        .then((r) => r.json())
        .then((data: { papers: Paper[]; errors?: string[] }) => {
          if (cancelled) return;
          setArxivFetched({ key, papers: data.papers ?? [], state: data.errors?.length ? "error" : "ready" });
        })
        .catch(() => {
          if (cancelled) return;
          const c = getFeedCache(key);
          setArxivFetched({ key, papers: c ? c.papers.filter((p) => p.source === "arxiv") : [], state: "error" });
        });
    }

    return () => {
      cancelled = true;
    };
  }, [hydrated, cacheKey, categories]);

  const papers = useMemo(() => dedupAndSort(arxivPapers, hfPapers), [arxivPapers, hfPapers]);

  // Write fresh results to the session cache (external write only — no setState).
  useEffect(() => {
    if (arxivState === "ready" && hfState === "ready" && papers.length > 0) {
      setFeedCache(cacheKey, papers);
    }
  }, [arxivState, hfState, papers, cacheKey]);

  const filtered = papers
    .filter((p) => withinWindow(p.publishedAt, windowKey))
    .sort((a, b) => {
      if (sort === "popular") {
        const pa = a.popularity ?? -1;
        const pb = b.popularity ?? -1;
        if (pb !== pa) return pb - pa;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const anyLoading = arxivState === "loading" || hfState === "loading";
  const bothError = arxivState === "error" && hfState === "error";
  const initialLoad = anyLoading && papers.length === 0;

  // 키보드 내비게이션 (j/k 이동, Enter/o 열기)
  const selectedIdx = useFeedKeyboard(filtered.length);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">신규 논문 피드</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {hydrated
              ? categories.length > 0
                ? `${categories.join(", ")} + HF 데일리 · ${labelForWindow(windowKey)}`
                : `HF 데일리 큐레이션 · ${labelForWindow(windowKey)} (카테고리를 추가하면 arXiv도 함께)`
              : " "}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md border border-[var(--border)] p-1 text-xs">
            {(["recent", "popular"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={[
                  "rounded px-2.5 py-1 font-medium transition-colors",
                  sort === s
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                {s === "recent" ? "최신순" : "🔥 인기순"}
              </button>
            ))}
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
        </div>
      </header>

      <StatusStrip
        arxivState={arxivState}
        hfState={hfState}
        usingCache={usingCache && anyLoading}
        arxivEnabled={categories.length > 0}
      />

      {initialLoad && <SkeletonList />}

      {bothError && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          논문을 가져오는 중 오류가 발생했어요. 잠시 후 새로고침해 주세요.
        </p>
      )}

      {!initialLoad && !bothError && filtered.length === 0 && (
        <EmptyState
          title={`${labelForWindow(windowKey)} 신규 논문이 없습니다`}
          body="더 넓은 기간으로 바꾸거나, 카테고리를 추가해 보세요."
          cta={categories.length === 0 ? { href: "/categories", label: "카테고리 설정으로" } : undefined}
        />
      )}

      {filtered.length > 0 && (
        <p className="mb-2 hidden text-right text-xs text-[var(--muted)] sm:block">
          ⌨ <kbd className="font-mono">j</kbd>/<kbd className="font-mono">k</kbd> 이동 ·{" "}
          <kbd className="font-mono">Enter</kbd> 열기
        </p>
      )}
      <div className="grid gap-3">
        {filtered.map((p, i) => (
          <div key={p.id} data-feed-item={i}>
            <PaperCard paper={p} selected={i === selectedIdx} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusStrip({
  arxivState,
  hfState,
  usingCache,
  arxivEnabled,
}: {
  arxivState: SourceState;
  hfState: SourceState;
  usingCache: boolean;
  arxivEnabled: boolean;
}) {
  // 실패는 사용자에게 노출하지 않는다. arXiv가 일시적으로 막혀도(429 등)
  // HF·캐시로 피드가 채워지므로, 한쪽 소스 실패는 조용히 처리.
  // 둘 다 실패해 결과가 0인 경우만 본문의 bothError 안내가 담당한다.
  const items: string[] = [];
  if (usingCache) items.push("💾 캐시에서 즉시 표시 (갱신 중)");
  if (hfState === "loading") items.push("HF 데일리 로딩 중…");
  if (arxivEnabled && arxivState === "loading") items.push("arXiv 로딩 중…");
  if (items.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
      {items.map((t) => (
        <span key={t} className="rounded-full border border-[var(--border)] px-2 py-0.5">
          {t}
        </span>
      ))}
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
