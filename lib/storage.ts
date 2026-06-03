"use client";

import type { Paper, PaperSource } from "./types";

const KEYS = {
  categories: "my-arxiv:categories",
  read: "my-arxiv:read",
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
