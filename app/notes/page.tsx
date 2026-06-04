"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getLaterSet,
  getMeta,
  getNotes,
  getReadSet,
  STORAGE_EVENT,
  type MetaMap,
  type NoteMap,
} from "@/lib/storage";

type Tab = "notes" | "later" | "read" | "all";

const TABS: { code: Tab; label: string }[] = [
  { code: "notes", label: "노트" },
  { code: "later", label: "🔖 나중에" },
  { code: "read", label: "읽음" },
  { code: "all", label: "전체" },
];

const SOURCE_LABEL: Record<string, string> = {
  arxiv: "arXiv",
  huggingface: "HF",
  paperswithcode: "PwC",
};

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteMap>({});
  const [meta, setMeta] = useState<MetaMap>({});
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [laterIds, setLaterIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("notes");
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setNotes(getNotes());
      setMeta(getMeta());
      setReadIds(getReadSet());
      setLaterIds(getLaterSet());
    };
    sync();
    setHydrated(true);
    window.addEventListener(STORAGE_EVENT, sync);
    return () => window.removeEventListener(STORAGE_EVENT, sync);
  }, []);

  const entries = useMemo(() => {
    const ids = new Set<string>();
    if (tab === "notes" || tab === "all") Object.keys(notes).forEach((id) => ids.add(id));
    if (tab === "later" || tab === "all") laterIds.forEach((id) => ids.add(id));
    if (tab === "read" || tab === "all") readIds.forEach((id) => ids.add(id));

    const q = query.trim().toLowerCase();

    return [...ids]
      .map((id) => ({
        id,
        note: notes[id],
        meta: meta[id],
        isRead: readIds.has(id),
        isLater: laterIds.has(id),
      }))
      .filter(({ note, meta, id }) => {
        if (!q) return true;
        return (
          (note?.body ?? "").toLowerCase().includes(q) ||
          (meta?.title ?? "").toLowerCase().includes(q) ||
          (meta?.authors ?? []).join(" ").toLowerCase().includes(q) ||
          id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ta = a.note?.updatedAt ?? a.meta?.publishedAt ?? "";
        const tb = b.note?.updatedAt ?? b.meta?.publishedAt ?? "";
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
  }, [notes, meta, readIds, laterIds, tab, query]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">노트</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {hydrated
            ? `노트 ${Object.keys(notes).length}건 · 🔖 나중에 ${laterIds.size}건 · 읽음 ${readIds.size}건`
            : " "}
        </p>
      </header>

      <div className="mb-3 inline-flex rounded-md border border-[var(--border)] bg-[var(--card)] p-1 text-xs">
        {TABS.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setTab(t.code)}
            className={[
              "rounded px-3 py-1 font-medium transition-colors",
              tab === t.code
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 focus-within:border-[var(--accent)]">
          <span className="text-[var(--muted)]">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·저자·노트 본문에서 검색"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {hydrated && entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <p className="text-base font-semibold">
            {query
              ? "일치하는 항목이 없습니다"
              : tab === "notes"
              ? "아직 노트가 없습니다"
              : tab === "later"
              ? "나중에 읽을 논문이 없습니다"
              : tab === "read"
              ? "읽은 논문이 없습니다"
              : "기록이 없습니다"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            피드에서 카드를 열어 노트나 읽음 표시를 남겨보세요.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {entries.map(({ id, note, meta, isRead, isLater }) => (
            <li key={id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                {meta && (
                  <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-semibold text-[var(--accent)]">
                    {SOURCE_LABEL[meta.source] ?? meta.source}
                  </span>
                )}
                {isLater && <span className="text-amber-600 dark:text-amber-400">🔖 나중에</span>}
                {isRead && <span className="text-[var(--accent)]">✓ 읽음</span>}
                {note && <span>📝 노트</span>}
                <span className="ml-auto font-mono">{id}</span>
              </div>
              {meta ? (
                <Link
                  href={meta.detailHref}
                  className="block text-base font-semibold leading-snug hover:underline"
                >
                  {meta.title}
                </Link>
              ) : (
                <p className="text-sm italic text-[var(--muted)]">메타데이터 없음 (예전에 저장된 항목)</p>
              )}
              {meta?.authors?.length ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {meta.authors.slice(0, 5).join(", ")}
                  {meta.authors.length > 5 ? " 외" : ""}
                </p>
              ) : null}
              {note && (
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-[var(--foreground)]/85">
                  {note.body}
                </pre>
              )}
              {note && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {new Date(note.updatedAt).toLocaleString("ko-KR")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
