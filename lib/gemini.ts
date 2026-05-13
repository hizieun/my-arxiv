import { GoogleGenAI } from "@google/genai";

function buildPrompt(title: string, abstract: string): string {
  return `다음 논문의 Abstract를 한국어로 3가지 핵심 포인트로 요약해주세요.
번호 목록 형식(1. 2. 3.)으로, 각 항목은 1~2문장으로 간결하게 작성해주세요.

제목: ${title}

Abstract:
${abstract}`;
}

export async function summarizeAbstract(title: string, abstract: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: buildPrompt(title, abstract),
  });
  return response.text ?? "";
}
