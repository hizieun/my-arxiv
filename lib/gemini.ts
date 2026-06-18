import { GoogleGenAI } from "@google/genai";

const SECTION_GUIDE = `다음 섹션 제목(이모지 포함)을 그대로 사용하고, 각 섹션 사이는 빈 줄로 구분하세요.
마크다운 기호(#, *, -, \`)는 쓰지 말고, 각 섹션 본문은 자연스러운 문장으로 작성하세요.

📌 한 줄 요약
이 논문이 무엇을 했는지 한 문장으로.

🎯 풀려는 문제
어떤 문제·한계를 다루는지. 기존 접근의 한계가 언급되면 함께 설명.

🔧 핵심 접근
제안하는 방법·아이디어의 핵심과 작동 방식. 무엇이 새로운지 분명히.

📊 핵심 결과
주요 성과와 구체적 수치(정확도·배수·% 등). 실험·평가 결과가 있으면 포함.

💡 의의
왜 중요한지, 어떤 분야·후속 연구에 기여하는지.`;

function buildAbstractPrompt(title: string, abstract: string): string {
  return `당신은 AI/ML 논문을 한국어로 깊이 있게 요약하는 전문가입니다.
아래 논문의 Abstract를 바탕으로, **이 요약만 읽어도 논문의 핵심을 파악할 수 있도록** 구조화해 작성하세요.

${SECTION_GUIDE}

작성 규칙:
- 한국어로, 각 섹션은 2~4문장 분량으로 충실하게.
- Abstract에 없는 구체적 수치·사실을 지어내지 마세요. 불확실하면 일반화해 서술하고 단정하지 마세요.
- 전문 용어는 처음 나올 때 괄호로 짧게 풀어주세요. 예: RAG(검색 증강 생성).

제목: ${title}

Abstract:
${abstract}`;
}

function buildFulltextPrompt(title: string, abstract: string, fulltext: string): string {
  return `당신은 AI/ML 논문을 한국어로 깊이 있게 요약하는 전문가입니다.
아래 논문의 **본문 전문**을 바탕으로, **이 요약만 읽어도 논문의 핵심을 파악할 수 있도록** 구조화해 작성하세요.
본문에서 방법의 구체적 작동 방식과 실험 결과의 수치를 적극 활용하세요.

${SECTION_GUIDE}

작성 규칙:
- 한국어로, 각 섹션은 2~4문장으로 핵심만 간결하게. 특히 🔧 핵심 접근과 📊 핵심 결과는 본문 근거로 구체적으로(단, 장황하지 않게).
- 본문에 없는 사실·수치를 지어내지 마세요. 본문에 근거한 내용만 서술하세요.
- 전문 용어는 처음 나올 때 괄호로 짧게 풀어주세요. 예: RAG(검색 증강 생성).
- 본문에 LaTeX 잔재나 수식 기호가 섞여 있을 수 있으니, 수식 기호를 그대로 옮기지 말고 의미만 취해 자연스러운 한국어로 풀어주세요.

제목: ${title}

Abstract:
${abstract}

본문 전문:
${fulltext}`;
}

interface SummarizeInput {
  title: string;
  abstract: string;
  fulltext?: string | null;
}

// fulltext가 주어지면 본문 기반 심층 요약, 없으면 abstract 기반 요약.
export async function summarizePaper({ title, abstract, fulltext }: SummarizeInput): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = fulltext
    ? buildFulltextPrompt(title, abstract, fulltext)
    : buildAbstractPrompt(title, abstract);

  // thinkingBudget을 제한해 응답 시간을 통제(무제한 동적 thinking은 본문 요약에서
  // 30s+까지 늘어나 Vercel 함수 타임아웃·UX 문제). 2048이면 구조화엔 충분.
  // maxOutputTokens로 출력 폭주도 방지. 503/과부하는 짧게 재시도.
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          maxOutputTokens: 4096,
        },
      });
      return response.text ?? "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const transient = /\b(503|500|UNAVAILABLE|overloaded|high demand|deadline)\b/i.test(msg);
      if (!transient || attempt === maxAttempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); // 1s → 2s
    }
  }
  throw new Error("Gemini: no response"); // 도달 불가 (루프가 반환/throw)
}
