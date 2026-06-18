import { NextRequest, NextResponse } from "next/server";
import { fetchArxivFulltext } from "@/lib/arxiv";
import { summarizePaper } from "@/lib/gemini";
import { extractArxivId } from "@/lib/huggingface";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.abstract) {
    return NextResponse.json({ error: "title and abstract required" }, { status: 400 });
  }
  try {
    // paperId가 arXiv id로 환산되면 본문 전문을 시도 → 실패 시 abstract로 폴백.
    const arxivId = body.paperId ? extractArxivId(body.paperId as string) : null;
    const fulltext = arxivId ? await fetchArxivFulltext(arxivId) : null;

    const summary = await summarizePaper({
      title: body.title as string,
      abstract: body.abstract as string,
      fulltext,
    });
    return NextResponse.json({ summary, mode: fulltext ? "fulltext" : "abstract" });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    console.error("[summary]", raw);
    const message = raw.includes("429") || raw.includes("quota")
      ? "API 할당량 초과 — aistudio.google.com에서 무료 티어 키를 확인해주세요."
      : raw.includes("API_KEY") || raw.includes("401") || raw.includes("403")
      ? "API 키가 유효하지 않습니다."
      : "요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
