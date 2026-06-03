import { NextRequest, NextResponse } from "next/server";
import { fetchArxivPapers } from "@/lib/arxiv";
import { fetchHFDailyPapers } from "@/lib/huggingface";
import { dedupAndSort } from "@/lib/aggregator";

export const revalidate = 1800;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categories = url.searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const source = url.searchParams.get("source");
  const includeArxiv = (source === null || source === "arxiv") && categories.length > 0;
  const includeHF = source === null || source === "hf";

  if (!includeArxiv && !includeHF) {
    return NextResponse.json({ papers: [] });
  }

  const [arxivResult, hfResult] = await Promise.allSettled([
    includeArxiv
      ? fetchArxivPapers({
          categories,
          maxResults: 40,
          sortBy: "submittedDate",
          sortOrder: "descending",
        })
      : Promise.resolve([]),
    includeHF ? fetchHFDailyPapers(30) : Promise.resolve([]),
  ]);

  const arxiv = arxivResult.status === "fulfilled" ? arxivResult.value : [];
  const hf = hfResult.status === "fulfilled" ? hfResult.value : [];

  const errors: string[] = [];
  if (arxivResult.status === "rejected") errors.push(`arxiv: ${String(arxivResult.reason)}`);
  if (hfResult.status === "rejected") errors.push(`hf: ${String(hfResult.reason)}`);

  const papers = source === null ? dedupAndSort(arxiv, hf) : source === "arxiv" ? arxiv : hf;

  return NextResponse.json({
    papers,
    errors: errors.length ? errors : undefined,
    counts: { arxiv: arxiv.length, huggingface: hf.length, merged: papers.length },
  });
}
