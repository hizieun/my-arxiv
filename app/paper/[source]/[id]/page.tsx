"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import type { Paper, PaperSource } from "@/lib/types";
import { getNotes, getReadSet, getSummaries, rememberPaper, saveSummary, setNote, STORAGE_EVENT, toggleRead } from "@/lib/storage";

const SOURCE_LABEL: Record<PaperSource, string> = {
  arxiv: "arXiv",
  huggingface: "HuggingFace",
  paperswithcode: "Papers with Code",
};

interface PageProps {
  params: Promise<{ source: string; id: string }>;
}

export default function PaperDetailPage({ params }: PageProps) {
  const { source: rawSource, id } = use(params);
  const source = rawSource as PaperSource;
  const [paper, setPaper] = useState<Paper | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [note, setNoteState] = useState("");
  const [read, setRead] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setStatus("loading");
    fetch(`/api/paper/${source}/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { paper: Paper }) => {
        setPaper(data.paper);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [source, id]);

  useEffect(() => {
    if (!paper) return;
    const sync = () => {
      const notes = getNotes();
      setNoteState(notes[paper.id]?.body ?? "");
      setSavedAt(notes[paper.id]?.updatedAt ?? null);
      setRead(getReadSet().has(paper.id));
    };
    sync();
    setHydrated(true);
    window.addEventListener(STORAGE_EVENT, sync);

    const cached = getSummaries()[paper.id];
    if (cached) setSummary(cached.text);

    return () => window.removeEventListener(STORAGE_EVENT, sync);
  }, [paper]);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 240)}px`;
  }, []);

  useEffect(() => {
    if (paper) autoGrow();
  }, [paper, note, autoGrow]);

  function handleSave() {
    if (!paper) return;
    rememberPaper(paper);
    setNote(paper.id, note);
    setSavedAt(new Date().toISOString());
  }

  async function handleSummarize() {
    if (!paper || summaryLoading) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: paper.title, abstract: paper.abstract }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요약 실패");
      setSummary(data.summary);
      saveSummary(paper.id, data.summary);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleToggleRead() {
    if (!paper) return;
    rememberPaper(paper);
    setRead(toggleRead(paper.id));
  }

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
        {!summary && !summaryLoading && !summaryError && (
          <p className="text-sm text-[var(--muted)]">버튼을 눌러 한국어 핵심 요약을 생성합니다.</p>
        )}
      </section>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={handleToggleRead}
          className={[
            "rounded-md border px-3 py-1.5 font-medium transition-colors",
            hydrated && read
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--border)] hover:border-[var(--muted)]",
          ].join(" ")}
        >
          {hydrated && read ? "✓ 읽음" : "읽음 표시"}
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
