"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import type { Paper, PaperSource } from "@/lib/types";
import { PaperQA } from "@/components/PaperQA";
import {
  getNotes,
  getSummaries,
  rememberPaper,
  saveSummary,
  setNote,
  toggleLater,
  toggleRead,
  useLaterSet,
  useNotes,
  useReadSet,
} from "@/lib/storage";

const SOURCE_LABEL: Record<PaperSource, string> = {
  arxiv: "arXiv",
  huggingface: "HuggingFace",
  paperswithcode: "Papers with Code",
};

interface PageProps {
  params: Promise<{ source: string; id: string }>;
}

type FetchState = { key: string; paper: Paper | null; status: "ready" | "error" };

export default function PaperDetailPage({ params }: PageProps) {
  const { source: rawSource, id } = use(params);
  const source = rawSource as PaperSource;
  const reqKey = `${source}/${id}`;

  // Fetch result is tagged with the request key; `status`/`paper` derive to a
  // loading/empty state whenever the route params change before the new fetch
  // resolves. State is only set inside async callbacks (never synchronously),
  // satisfying react-hooks/set-state-in-effect.
  const [fetched, setFetched] = useState<FetchState | null>(null);
  const status: "loading" | "ready" | "error" =
    fetched?.key === reqKey ? fetched.status : "loading";
  const paper = fetched?.key === reqKey ? fetched.paper : null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/paper/${source}/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { paper: Paper }) => {
        if (!cancelled) setFetched({ key: reqKey, paper: data.paper, status: "ready" });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: reqKey, paper: null, status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [reqKey, source, id]);

  if (status === "loading") {
    return <div className="space-y-3"><div className="h-8 w-2/3 animate-pulse rounded bg-[var(--card)]" /><div className="h-48 animate-pulse rounded-xl bg-[var(--card)]" /></div>;
  }
  if (status === "error" || !paper) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
        <p className="text-base font-semibold">논문을 불러올 수 없습니다</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{source} / {id}</p>
        <Link href="/" className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          피드로 돌아가기
        </Link>
      </div>
    );
  }

  // Keyed by paper.id so navigating to a different paper remounts the view,
  // re-seeding its local (editable) note/summary state from storage cleanly —
  // no setState-in-effect needed for hydration.
  return <PaperDetailView key={paper.id} paper={paper} />;
}

function PaperDetailView({ paper }: { paper: Paper }) {
  const read = useReadSet().has(paper.id);
  const later = useLaterSet().has(paper.id);
  const savedAt = useNotes()[paper.id]?.updatedAt ?? null;

  // Editable / generated state seeded once from storage at mount (this view is
  // client-only: it renders only after the async fetch resolves).
  const [note, setNoteState] = useState<string>(() => getNotes()[paper.id]?.body ?? "");
  const [summary, setSummary] = useState<string | null>(
    () => getSummaries()[paper.id]?.text ?? null,
  );
  const [summaryAt, setSummaryAt] = useState<string | null>(
    () => getSummaries()[paper.id]?.generatedAt ?? null,
  );
  const [summaryMode, setSummaryMode] = useState<string | null>(
    () => getSummaries()[paper.id]?.mode ?? null,
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 240)}px`;
  }, []);

  useEffect(() => {
    autoGrow();
  }, [note, autoGrow]);

  function handleSave() {
    rememberPaper(paper);
    setNote(paper.id, note); // savedAt re-derives from useNotes()
  }

  async function handleSummarize() {
    if (summaryLoading) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: paper.title, abstract: paper.abstract, paperId: paper.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요약 실패");
      setSummary(data.summary);
      saveSummary(paper.id, data.summary, data.mode);
      setSummaryAt(getSummaries()[paper.id]?.generatedAt ?? null);
      setSummaryMode(data.mode ?? null);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleToggleRead() {
    rememberPaper(paper);
    toggleRead(paper.id);
  }

  function handleToggleLater() {
    rememberPaper(paper);
    toggleLater(paper.id);
  }

  return (
    <article className="space-y-6">
      <Link href="/" className="inline-flex text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
        ← 피드로
      </Link>

      <header>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-semibold text-[var(--accent)]">
            {SOURCE_LABEL[paper.source]}
          </span>
          {paper.hfDaily && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              📅 HF Daily
            </span>
          )}
          {typeof paper.popularity === "number" && paper.popularity > 0 && (
            <span
              className={[
                "rounded px-1.5 py-0.5 font-semibold",
                paper.popularity >= 10
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
              ].join(" ")}
            >
              🔥 {paper.popularity}
            </span>
          )}
          {paper.categories.slice(0, 6).map((c) => (
            <span key={c} className="font-mono">{c}</span>
          ))}
          <span className="ml-auto">{formatDate(paper.publishedAt)}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{paper.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{paper.authors.join(", ")}</p>
      </header>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Abstract</h2>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--foreground)]/90">{paper.abstract}</p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">AI 요약</h2>
          <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
            Gemini
          </span>
          {summary && summaryMode === "fulltext" && (
            <span
              className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              title="논문 본문 전문을 바탕으로 생성된 요약"
            >
              📄 본문 기반
            </span>
          )}
          {!summary && !summaryLoading && (
            <button
              type="button"
              onClick={handleSummarize}
              className="ml-auto rounded-md border border-[var(--border)] px-3 py-1 text-xs font-medium hover:border-[var(--muted)]"
            >
              한국어 요약 보기
            </button>
          )}
          {summary && (
            <button
              type="button"
              onClick={handleSummarize}
              className="ml-auto text-[10px] text-[var(--muted)] hover:text-[var(--foreground)]"
              title="다시 생성"
            >
              ↺ 재생성
            </button>
          )}
        </div>
        {summaryLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            요약 생성 중…
          </div>
        )}
        {summaryError && (
          <p className="text-sm text-red-600 dark:text-red-400">{summaryError}</p>
        )}
        {summary && !summaryLoading && (
          <div className="space-y-2 text-[15px] leading-relaxed text-[var(--foreground)]/90 whitespace-pre-line">
            {summary}
          </div>
        )}
        {summary && summaryAt && !summaryLoading && (
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            💾 캐시됨 · {new Date(summaryAt).toLocaleString("ko-KR")} (재호출 없이 저장된 요약 표시 중)
          </p>
        )}
        {!summary && !summaryLoading && !summaryError && (
          <p className="text-sm text-[var(--muted)]">버튼을 눌러 한국어 핵심 요약을 생성합니다.</p>
        )}
      </section>

      <PaperQA paperId={paper.id} title={paper.title} abstract={paper.abstract} />

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={handleToggleRead}
          className={[
            "rounded-md border px-3 py-1.5 font-medium transition-colors",
            read
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--border)] hover:border-[var(--muted)]",
          ].join(" ")}
        >
          {read ? "✓ 읽음" : "읽음 표시"}
        </button>
        <button
          type="button"
          onClick={handleToggleLater}
          className={[
            "rounded-md border px-3 py-1.5 font-medium transition-colors",
            later
              ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/60 dark:bg-amber-900/30 dark:text-amber-300"
              : "border-[var(--border)] hover:border-[var(--muted)]",
          ].join(" ")}
        >
          {later ? "🔖 나중에 읽기" : "🔖 나중에"}
        </button>
        {paper.pdfUrl && (
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 font-medium hover:border-[var(--muted)]"
          >
            PDF
          </a>
        )}
        <a
          href={paper.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-[var(--border)] px-3 py-1.5 font-medium hover:border-[var(--muted)]"
        >
          원문 ↗
        </a>
        <Link
          href={`/community/new?${new URLSearchParams({
            title: paper.title,
            body: `> 📄 관련 논문: [${paper.title}](${paper.htmlUrl})\n\n`,
            tags: "논문리뷰",
          }).toString()}`}
          className="ml-auto rounded-md bg-[var(--accent)] px-3 py-1.5 font-medium text-white hover:opacity-90"
        >
          ✍️ 이 논문으로 학습 글 쓰기
        </Link>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">노트</h2>
          {savedAt && (
            <span className="text-xs text-[var(--muted)]">
              저장됨 · {new Date(savedAt).toLocaleString("ko-KR")}
            </span>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => {
            setNoteState(e.target.value);
            autoGrow();
          }}
          placeholder="이 논문에 대한 자유로운 메모 (마크다운 가능). Ctrl/Cmd+S로 저장."
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
              e.preventDefault();
              handleSave();
            }
          }}
          className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-sm leading-relaxed outline-none focus:border-[var(--accent)]"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            저장
          </button>
        </div>
      </section>
    </article>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}
