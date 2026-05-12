"use client";

import { useEffect, useState } from "react";
import type { Paper } from "@/lib/types";
import { getNotes, getReadSet, setNote, STORAGE_EVENT, toggleRead } from "@/lib/storage";

interface Props {
  paper: Paper;
}

const SOURCE_LABEL: Record<Paper["source"], string> = {
  arxiv: "arXiv",
  huggingface: "HF",
  paperswithcode: "PwC",
};

export function PaperCard({ paper }: Props) {
  const [read, setRead] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNoteState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setRead(getReadSet().has(paper.id));
      setNoteState(getNotes()[paper.id]?.body ?? "");
    };
    sync();
    setHydrated(true);
    window.addEventListener(STORAGE_EVENT, sync);
    return () => window.removeEventListener(STORAGE_EVENT, sync);
  }, [paper.id]);

  function handleToggleRead() {
    setRead(toggleRead(paper.id));
  }

  function handleSaveNote() {
    setNote(paper.id, note);
    setShowNote(false);
  }

  return (
    <article
      className={[
        "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-opacity",
        hydrated && read ? "opacity-60" : "",
      ].join(" ")}
    >
      <header className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-semibold text-[var(--accent)]">
          {SOURCE_LABEL[paper.source]}
        </span>
        {paper.categories.slice(0, 3).map((c) => (
          <span key={c} className="font-mono">
            {c}
          </span>
        ))}
        <span className="ml-auto">{formatDate(paper.publishedAt)}</span>
      </header>

      <h3 className="text-base font-semibold leading-snug">
        <a href={paper.htmlUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {paper.title}
        </a>
      </h3>

      <p className="mt-1 text-xs text-[var(--muted)]">{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? " 외" : ""}</p>

      <p className="mt-3 line-clamp-3 text-sm text-[var(--foreground)]/85">{paper.abstract}</p>

      <footer className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleToggleRead}
          className={[
            "rounded-md border px-2.5 py-1 font-medium transition-colors",
            read
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--border)] hover:border-[var(--muted)]",
          ].join(" ")}
        >
          {read ? "✓ 읽음" : "읽음 표시"}
        </button>
        <button
          type="button"
          onClick={() => setShowNote((v) => !v)}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 font-medium hover:border-[var(--muted)]"
        >
          📝 노트{note ? " •" : ""}
        </button>
        {paper.pdfUrl && (
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--border)] px-2.5 py-1 font-medium hover:border-[var(--muted)]"
          >
            PDF
          </a>
        )}
        <a
          href={paper.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          원문 →
        </a>
      </footer>

      {showNote && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNoteState(e.target.value)}
            placeholder="이 논문에 대한 메모 (마크다운 가능)"
            rows={4}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNote(false)}
              className="rounded-md px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="rounded-md bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}
