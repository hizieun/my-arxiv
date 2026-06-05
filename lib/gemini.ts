import { GoogleGenAI } from "@google/genai";

function buildPrompt(title: string, abstract: string): string {
  return `당신은 AI/ML 논문을 한국어로 깊이 있게 요약하는 전문가입니다.
아래 논문의 Abstract를 바탕으로, **이 요약만 읽어도 논문의 핵심을 파악할 수 있도록** 구조화해 작성하세요.

다음 섹션 제목(이모지 포함)을 그대로 사용하고, 각 섹션 사이는 빈 줄로 구분하세요.
마크다운 기호(#, *, -, \`)는 쓰지 말고, 각 섹션 본문은 자연스러운 문장으로 작성하세요.

📌 한 줄 요약
이 논문이 무엇을 했는지 한 문장으로.

🎯 풀려는 문제
어떤 문제·한계를 다루는지. 기존 접근의 한계가 언급되면 함께 설명.

🔧 핵심 접근
제안하는 방법·아이디어의 핵심과 작동 방식. 무엇이 새로운지 분명히.

📊 핵심 결과
주요 성과. Abstract에 수치(정확도·배수·% 등)가 있으면 반드시 포함.

💡 의의
왜 중요한지, 어떤 분야·후속 연구에 기여하는지.

작성 규칙:
- 한국어로, 각 섹션은 2~4문장 분량으로 충실하게.
- Abstract에 없는 구체적 수치·사실을 지어내지 마세요. 불확실하면 일반화해 서술하고 단정하지 마세요.
- 전문 용어는 처음 나올 때 괄호로 짧게 풀어주세요. 예: RAG(검색 증강 생성).

제목: ${title}

Abstract:
${abstract}`;
}

export async function summarizeAbstract(title: string, abstract: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });
  // thinkingConfig를 명시하지 않아 gemini-2.5-flash의 기본 동적 thinking이
  // 활성화됨 → 구조화·추론 품질 향상. (이전엔 속도 위해 thinkingBudget: 0으로 껐음)
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildPrompt(title, abstract),
  });
  return response.text ?? "";
}
