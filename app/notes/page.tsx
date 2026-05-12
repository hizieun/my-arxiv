"use client";

import { useEffect, useState } from "react";
import { getNotes, getReadSet, STORAGE_EVENT, type NoteMap } from "@/lib/storage";

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteMap>({});
  const [readCount, setReadCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setNotes(getNotes());
      setReadCount(getReadSet().size);
    };
    sync();
    setHydrated(true);
    window.addEventListener(STORAGE_EVENT, sync);
    return () => window.removeEventListener(STORAGE_EVENT, sync);
  }, []);

  const entries = Object.entries(notes).sort(
    (a, b) => new Date(b[1].updatedAt).getTime() - new Date(a[1].updatedAt).getTime(),
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">노트</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {hydrated ? `노트 ${entries.length}건 · 읽음 ${readCount}건` : " "}
        </p>
      </header>

      {hydrated && entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <p className="text-base font-semibold">아직 노트가 없습니다</p>
          <p className="mt-1 text-sm text-[var(--muted)]">피드에서 논문 카드의 “노트” 버튼으로 메모를 남겨보세요.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {entries.map(([paperId, note]) => (
            <li key={paperId} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="font-mono">{paperId}</span>
                <span>{new Date(note.updatedAt).toLocaleString("ko-KR")}</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm">{note.body}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
