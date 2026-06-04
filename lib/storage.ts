"use client";

import type { Paper, PaperSource } from "./types";

const KEYS = {
  categories: "my-arxiv:categories",
  read: "my-arxiv:read",
  later: "my-arxiv:later",
  notes: "my-arxiv:notes",
  meta: "my-arxiv:meta",
  summaries: "my-arxiv:summaries",
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

export function getLaterSet(): Set<string> {
  return new Set(safeGet<string[]>(KEYS.later, []));
}

export type ReadingStatus = "unread" | "later" | "read";

export function getReadingStatus(paperId: string): ReadingStatus {
  if (getReadSet().has(paperId)) return "read";
  if (getLaterSet().has(paperId)) return "later";
  return "unread";
}

// "읽음" 토글. read로 표시되면 later에서 제거(상호배타).
export function toggleRead(paperId: string): boolean {
  const read = getReadSet();
  const isRead = read.has(paperId);
  if (isRead) {
    read.delete(paperId);
    safeSet(KEYS.read, [...read]);
  } else {
    read.add(paperId);
    const later = getLaterSet();
    if (later.delete(paperId)) safeSet(KEYS.later, [...later]);
    safeSet(KEYS.read, [...read]);
  }
  return !isRead;
}

// "나중에" 토글. later로 표시되면 read에서 제거(상호배타).
export function toggleLater(paperId: string): boolean {
  const later = getLaterSet();
  const isLater = later.has(paperId);
  if (isLater) {
    later.delete(paperId);
    safeSet(KEYS.later, [...later]);
  } else {
    later.add(paperId);
    const read = getReadSet();
    if (read.delete(paperId)) safeSet(KEYS.read, [...read]);
    safeSet(KEYS.later, [...later]);
  }
  return !isLater;
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

export interface PaperMeta {
  title: string;
  source: PaperSource;
  authors: string[];
  publishedAt: string;
  htmlUrl: string;
  detailHref: string;
}

export type MetaMap = Record<string, PaperMeta>;

export function getMeta(): MetaMap {
  return safeGet<MetaMap>(KEYS.meta, {});
}

export function rememberPaper(paper: Paper): void {
  const meta = getMeta();
  const stripped = paper.id.split(":")[1] ?? paper.id;
  meta[paper.id] = {
    title: paper.title,
    source: paper.source,
    authors: paper.authors,
    publishedAt: paper.publishedAt,
    htmlUrl: paper.htmlUrl,
    detailHref: `/paper/${paper.source}/${stripped}`,
  };
  safeSet(KEYS.meta, meta);
}

type SummaryMap = Record<string, { text: string; generatedAt: string }>;

export function getSummaries(): SummaryMap {
  return safeGet<SummaryMap>(KEYS.summaries, {});
}

export function saveSummary(paperId: string, text: string): void {
  const summaries = getSummaries();
  summaries[paperId] = { text, generatedAt: new Date().toISOString() };
  safeSet(KEYS.summaries, summaries);
}

interface FeedCacheEntry {
  papers: Paper[];
  fetchedAt: number;
}

const FEED_CACHE_KEY = "my-arxiv:feed-cache";

function safeSessionGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSessionSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function getFeedCache(cacheKey: string): FeedCacheEntry | null {
  const all = safeSessionGet<Record<string, FeedCacheEntry>>(FEED_CACHE_KEY, {});
  return all[cacheKey] ?? null;
}

export function setFeedCache(cacheKey: string, papers: Paper[]): void {
  const all = safeSessionGet<Record<string, FeedCacheEntry>>(FEED_CACHE_KEY, {});
  all[cacheKey] = { papers, fetchedAt: Date.now() };
  safeSessionSet(FEED_CACHE_KEY, all);
}

export const STORAGE_EVENT = "my-arxiv:storage";
