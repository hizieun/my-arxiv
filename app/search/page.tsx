"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PaperCard } from "@/components/PaperCard";
import type { Paper, PaperSource } from "@/lib/types";

const SOURCES: { code: PaperSource | "all"; label: string }[] = [
  { code: "all", label: "전체" },
  { code: "arxiv", label: "arXiv" },
  { code: "huggingface", label: "HF" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [source, setSource] = useState<(typeof SOURCES)[number]["code"]>("all");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [counts, setCounts] = useState<{ arxiv?: number; huggingface?: number; merged?: number }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const run = useCallback(async (q: string, src: typeof source) => {
    if (!q.trim()) return;
    setStatus("loading");
    const sources = src === "all" ? "arxiv,huggingface" : src;
    const params = new URLSearchParams({ q, sources });
    try {
      const res = await fetch(`/api/search?${params}`);
      const data = (await res.json()) as {
        papers: Paper[];
        counts?: typeof counts;
        errors?: string[];
      };
      setPapers(data.papers ?? []);
      setCounts(data.counts ?? {});
      setStatus(data.errors?.length ? "error" : "idle");
    } catch {
      setStatus("error");
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(query);
    run(query, source);
  }

  function handleSourceChange(next: typeof source) {
    setSource(next);
    if (submitted) run(submitted, next);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">검색</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">arXiv + HuggingFace 통합 키워드 검색</p>
      </header>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 focus-within:border-[var(--accent)]">
          <span className="text-[var(--muted)]">🔍</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: transformer attention efficiency, RAG long context, diffusion sampling"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            검색
          </button>
        </div>
      </form>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
        {SOURCES.map((s) => (
          <button
            key={s.code}
            type="button"
            onClick={() => handleSourceChange(s.code)}
            className={[
              "rounded-full border px-3 py-1 font-medium transition-colors",
              source === s.code
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
        {submitted && status === "idle" && (
          <span className="ml-2 text-[var(--muted)]">
            결과 {counts.merged ?? 0}건 (arXiv {counts.arxiv ?? 0} / HF {counts.huggingface ?? 0})
          </span>
        )}
      </div>

      {status === "loading" && (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--card)]"
            />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          검색 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {status === "idle" && submitted && papers.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <p className="text-base font-semibold">결과가 없습니다</p>
          <p className="mt-1 text-sm text-[var(--muted)]">다른 키워드를 시도해 보세요.</p>
        </div>
      )}

      <div className="grid gap-3">
        {papers.map((p) => (
          <PaperCard key={p.id} paper={p} />
        ))}
      </div>
    </div>
  );
}
