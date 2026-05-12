"use client";

const KEYS = {
  categories: "my-arxiv:categories",
  read: "my-arxiv:read",
  notes: "my-arxiv:notes",
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("my-arxiv:storage", { detail: { key } }));
  } catch {
    // ignore quota/serialization errors
  }
}

export function getCategories(fallback: string[]): string[] {
  return safeGet<string[]>(KEYS.categories, fallback);
}

export function setCategories(codes: string[]): void {
  safeSet(KEYS.categories, codes);
}

export function getReadSet(): Set<string> {
  return new Set(safeGet<string[]>(KEYS.read, []));
}

export function toggleRead(paperId: string): boolean {
  const set = getReadSet();
  const isRead = set.has(paperId);
  if (isRead) set.delete(paperId);
  else set.add(paperId);
  safeSet(KEYS.read, [...set]);
  return !isRead;
}

export type NoteMap = Record<string, { body: string; updatedAt: string }>;

export function getNotes(): NoteMap {
  return safeGet<NoteMap>(KEYS.notes, {});
}

export function setNote(paperId: string, body: string): void {
  const notes = getNotes();
  if (body.trim()) {
    notes[paperId] = { body, updatedAt: new Date().toISOString() };
  } else {
    delete notes[paperId];
  }
  safeSet(KEYS.notes, notes);
}

export const STORAGE_EVENT = "my-arxiv:storage";
