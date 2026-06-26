"use client";

import { useState } from "react";
import { getQA, saveQA, type QAEntry } from "@/lib/storage";

interface Props {
  paperId: string;
  title: string;
  abstract: string;
}

// 논문 본문/abstract 근거로 자유 질문. 히스토리는 localStorage에 영속(요약 캐시와 동일).
export function PaperQA({ paperId, title, abstract }: Props) {
  const [question, setQuestion] = useState("");
  // 같은 논문 재방문 시 저장된 Q&A를 즉시 표시 (lazy initializer로 시드)
  const [history, setHistory] = useState<QAEntry[]>(() => getQA(paperId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, title, abstract, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "답변 생성 실패");
      const next = [...history, { q, a: data.answer, mode: data.mode }];
      setHistory(next);
      saveQA(paperId, next);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "답변 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    saveQA(paperId, []);
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          논문 Q&amp;A
        </h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            기록 지우기
          </button>
        )}
      </div>

      {history.length > 0 && (
        <ul className="mb-4 space-y-4">
          {history.map((item, i) => (
            <li key={i} className="space-y-1.5">
              <p className="text-sm font-medium text-[var(--foreground)]">Q. {item.q}</p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--foreground)]/90">
                {item.a}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {item.mode === "fulltext" ? "📄 본문 기반" : "abstract 기반"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={ask} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="이 논문에 대해 무엇이든 물어보세요"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "답변 중…" : "질문"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      {history.length === 0 && !error && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          본문이 있으면 본문 전문, 없으면 abstract를 근거로 답합니다. 논문에 없는 내용은 지어내지 않아요.
        </p>
      )}
    </section>
  );
}
