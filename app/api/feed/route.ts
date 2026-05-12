import { NextRequest, NextResponse } from "next/server";
import { fetchArxivPapers } from "@/lib/arxiv";

export const revalidate = 1800;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categories = url.searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  if (categories.length === 0) {
    return NextResponse.json({ papers: [] });
  }

  try {
    const papers = await fetchArxivPapers({
      categories,
      maxResults: 40,
      sortBy: "submittedDate",
      sortOrder: "descending",
    });
    return NextResponse.json({ papers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message, papers: [] }, { status: 502 });
  }
}
