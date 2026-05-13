import { NextRequest, NextResponse } from "next/server";
import { summarizeAbstract } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.abstract) {
    return NextResponse.json({ error: "title and abstract required" }, { status: 400 });
  }
  try {
    const summary = await summarizeAbstract(body.title as string, body.abstract as string);
    return NextResponse.json({ summary });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "unknown";
    const message = raw.includes("429") || raw.includes("quota")
      ? "API 할당량 초과 — aistudio.google.com에서 무료 티어 키를 확인해주세요."
      : raw.includes("API_KEY") || raw.includes("401") || raw.includes("403")
      ? "API 키가 유효하지 않습니다."
      : "요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
