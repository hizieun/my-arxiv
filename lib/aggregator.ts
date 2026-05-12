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
      if (SOURCE_PRIORITY[paper.source] < SOURCE_PRIORITY[existing.source]) {
        seen.set(key, mergeCategories(paper, existing));
      } else {
        seen.set(key, mergeCategories(existing, paper));
      }
    }
  }
  return [...seen.values()].sort((a, b) => {
    const da = new Date(a.publishedAt).getTime();
    const db = new Date(b.publishedAt).getTime();
    return db - da;
  });
}

function mergeCategories(primary: Paper, other: Paper): Paper {
  const cats = new Set(primary.categories);
  for (const c of other.categories) cats.add(c);
  return { ...primary, categories: [...cats] };
}
