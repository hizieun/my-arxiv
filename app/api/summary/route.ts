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
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
