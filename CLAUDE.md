@AGENTS.md

# my-arxiv

관심있는 AI 분야 신규 논문을 한 곳에서 탐색·관리하는 개인용 디스커버리 웹앱.

## 현재 상태

→ **[STATUS.md](./STATUS.md) 를 먼저 읽으세요.** 마지막 작업, 다음 액션, 막힌 부분이 거기 있습니다.

## 주요 문서

- [STATUS.md](./STATUS.md) — 작업 추적 (가장 자주 갱신, 매 작업 후 업데이트)
- [docs/vision.md](./docs/vision.md) — 왜·누구를·뭘 위해 + 비목표
- [docs/roadmap.md](./docs/roadmap.md) — 월 단위 마일스톤
- [docs/decisions.md](./docs/decisions.md) — ADR (큰 선택의 근거)
- [docs/ideas.md](./docs/ideas.md) — 아이디어 인박스 (즉시 구현 X)
- [docs/learnings.md](./docs/learnings.md) — 트러블슈팅·다음에 만날 함정
- [.claude/agent.md](./.claude/agent.md) — 에이전트 페르소나·행동 원칙
- [README.md](./README.md) — 외부용 (배포·기능)
- [AGENTS.md](./AGENTS.md) — Next.js 16 작업 시 필수 룰

## 자주 쓰는 명령어

```bash
npm run dev       # Turbopack 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run start     # 빌드 서빙
npm run lint      # ESLint
npx tsc --noEmit  # 타입 체크
```

배포: Vercel 자동 (main 푸시 시).

## 코딩 컨벤션

- Next.js 16 App Router. 변경점은 학습 데이터와 다를 수 있음 → **`node_modules/next/dist/docs/` 먼저 읽기** (AGENTS.md 참조)
- 컴포넌트: `components/PascalCase.tsx`, lib: `lib/소문자.ts`
- 클라이언트 컴포넌트는 `"use client"` 명시
- 경로 alias: `@/lib/...`, `@/components/...`
- Tailwind 인라인 클래스 + CSS 변수 토큰 (`var(--accent)`, `var(--card)`, `var(--muted)` 등)
- UI 텍스트는 한국어
- 외부 SDK는 최소화 (예: arXiv Atom XML도 정규식 파서로 자체 구현)
- 외부 fetch: `next: { revalidate: ... }` 로 캐시 명시

## 작업 규칙

1. **작업 시작 전** — STATUS.md 읽고 컨텍스트 동기화
2. **큰 변경 전** — `docs/decisions.md`에 "왜 X 대신 Y인가" 기록
3. **작업 후** — STATUS.md 갱신 (마지막 작업, 다음 액션)
4. **함정 마주치면** — `docs/learnings.md`에 한 줄
5. **아이디어 떠오르면** — `docs/ideas.md`에 인박스 추가, 바로 구현하지 말 것
6. **추측 금지** — 모르면 파일 읽기, 모호하면 사용자에게 질문
