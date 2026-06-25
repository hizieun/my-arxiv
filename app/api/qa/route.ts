import { NextRequest, NextResponse } from "next/server";
import { fetchArxivFulltext } from "@/lib/arxiv";
import { answerQuestion } from "@/lib/gemini";
import { extractArxivId } from "@/lib/huggingface";

// 본문 fetch + Gemini는 기본 함수 타임아웃을 넘길 수 있어 상한을 늘린다.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.abstract || !body?.question) {
    return NextResponse.json(
      { error: "title, abstract, question required" },
      { status: 400 },
    );
  }
  try {
    // 요약과 동일하게 본문 전문을 시도 → 실패 시 abstract 기반으로 답변.
    const arxivId = body.paperId ? extractArxivId(body.paperId as string) : null;
    const fulltext = arxivId ? await fetchArxivFulltext(arxivId) : null;

    const answer = await answerQuestion({
      title: body.title as string,
      abstract: body.abstract as string,
      fulltext,
      question: String(body.question).slice(0, 500),
    });
    return NextResponse.json({ answer, mode: fulltext ? "fulltext" : "abstract" });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    console.error("[qa]", raw);
    const message =
      raw.includes("429") || raw.includes("quota")
        ? "API 할당량 초과 — aistudio.google.com에서 무료 티어 키를 확인해주세요."
        : raw.includes("API_KEY") || raw.includes("401") || raw.includes("403")
          ? "API 키가 유효하지 않습니다."
          : "답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
