import type { Paper, PaperSource } from "./types";
import { extractArxivId } from "./huggingface";

const SOURCE_PRIORITY: Record<PaperSource, number> = {
  arxiv: 0,
  huggingface: 1,
  paperswithcode: 2,
};

export function dedupAndSort(...lists: Paper[][]): Paper[] {
  const seen = new Map<string, Paper>();
  for (const list of lists) {
    for (const paper of list) {
      const key = extractArxivId(paper.id) ?? paper.id;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, paper);
        continue;
      }
      const primary =
        SOURCE_PRIORITY[paper.source] < SOURCE_PRIORITY[existing.source] ? paper : existing;
      const other = primary === paper ? existing : paper;
      seen.set(key, mergePapers(primary, other));
    }
  }
  return [...seen.values()].sort((a, b) => {
    const da = new Date(a.publishedAt).getTime();
    const db = new Date(b.publishedAt).getTime();
    return db - da;
  });
}

function mergePapers(primary: Paper, other: Paper): Paper {
  const cats = new Set(primary.categories);
  for (const c of other.categories) cats.add(c);
  return {
    ...primary,
    categories: [...cats],
    popularity: pickMax(primary.popularity, other.popularity),
    hfDaily: primary.hfDaily || other.hfDaily || undefined,
  };
}

function pickMax(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.max(a, b);
}
