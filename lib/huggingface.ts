import type { Paper } from "./types";

const HF_BASE = "https://huggingface.co/api";

interface HFAuthor {
  name: string;
}

interface HFPaperInner {
  id: string;
  title: string;
  summary: string;
  authors: HFAuthor[];
  publishedAt: string;
  ai_keywords?: string[];
  upvotes?: number;
}

interface HFDailyEntry {
  paper: HFPaperInner;
  publishedAt: string;
  title?: string;
  summary?: string;
}

interface HFSearchEntry {
  paper: HFPaperInner;
}

function toPaper(p: HFPaperInner): Paper {
  return {
    id: `hf:${p.id}`,
    source: "huggingface",
    title: stripWs(p.title),
    authors: (p.authors ?? []).map((a) => a.name),
    abstract: stripWs(p.summary),
    publishedAt: p.publishedAt,
    categories: p.ai_keywords?.slice(0, 4) ?? [],
    htmlUrl: `https://huggingface.co/papers/${p.id}`,
    pdfUrl: `https://arxiv.org/pdf/${p.id}.pdf`,
  };
}

function stripWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export async function fetchHFDailyPapers(limit = 30): Promise<Paper[]> {
  const url = `${HF_BASE}/daily_papers?limit=${limit}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "my-arxiv/0.2 (personal paper feed)" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`HF daily_papers ${res.status}`);
  const data = (await res.json()) as HFDailyEntry[];
  return data.map((d) => toPaper(d.paper));
}

export async function searchHFPapers(query: string, limit = 25): Promise<Paper[]> {
  if (!query.trim()) return [];
  const url = `${HF_BASE}/papers/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "my-arxiv/0.2 (personal paper feed)" },
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`HF papers search ${res.status}`);
  const data = (await res.json()) as HFSearchEntry[];
  return data.map((d) => toPaper(d.paper));
}

export function extractArxivId(paperId: string): string | null {
  if (paperId.startsWith("arxiv:")) return paperId.slice("arxiv:".length).replace(/v\d+$/, "");
  if (paperId.startsWith("hf:")) return paperId.slice("hf:".length).replace(/v\d+$/, "");
  return null;
}
