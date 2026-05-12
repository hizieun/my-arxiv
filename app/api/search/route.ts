import { NextRequest, NextResponse } from "next/server";
import { fetchArxivPapers } from "@/lib/arxiv";
import { searchHFPapers } from "@/lib/huggingface";
import { dedupAndSort } from "@/lib/aggregator";
import type { PaperSource } from "@/lib/types";

export const revalidate = 600;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const sourcesParam = url.searchParams.get("sources");
  const sources: Set<PaperSource> = new Set(
    (sourcesParam?.split(",").filter(Boolean) as PaperSource[]) ?? ["arxiv", "huggingface"],
  );

  if (!query) return NextResponse.json({ papers: [], counts: {} });

  const [arxivResult, hfResult] = await Promise.allSettled([
    sources.has("arxiv")
      ? fetchArxivPapers({ query, maxResults: 25, sortBy: "relevance" })
      : Promise.resolve([]),
    sources.has("huggingface") ? searchHFPapers(query, 25) : Promise.resolve([]),
  ]);

  const arxiv = arxivResult.status === "fulfilled" ? arxivResult.value : [];
  const hf = hfResult.status === "fulfilled" ? hfResult.value : [];

  const errors: string[] = [];
  if (arxivResult.status === "rejected") errors.push(`arxiv: ${String(arxivResult.reason)}`);
  if (hfResult.status === "rejected") errors.push(`hf: ${String(hfResult.reason)}`);

  const papers = dedupAndSort(arxiv, hf);

  return NextResponse.json({
    papers,
    errors: errors.length ? errors : undefined,
    counts: { arxiv: arxiv.length, huggingface: hf.length, merged: papers.length },
  });
}
