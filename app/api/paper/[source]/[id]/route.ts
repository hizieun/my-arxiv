import { NextRequest, NextResponse } from "next/server";
import { fetchArxivById } from "@/lib/arxiv";
import { fetchHFPaperById } from "@/lib/huggingface";

export const revalidate = 3600;

interface RouteContext {
  params: Promise<{ source: string; id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { source, id } = await ctx.params;
  try {
    let paper = null;
    if (source === "arxiv") paper = await fetchArxivById(id);
    else if (source === "huggingface") paper = await fetchHFPaperById(id);
    else return NextResponse.json({ error: "unknown source" }, { status: 400 });
    if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ paper });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
