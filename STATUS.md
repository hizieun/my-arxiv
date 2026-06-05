# STATUS

**마지막 업데이트:** 2026-06-04

## 한 줄

AI 요약 품질 업그레이드 — 단순 3줄 → 구조화 심층 요약(문제/접근/결과/의의 + 용어해설 + thinking 활성). 직전: arXiv 429 대응.

## 이번 주 목표

- [x] Gemini 한국어 요약 기능 추가 (`gemini-2.5-flash`, quota 0 이슈 해결)
- [x] 피드 점진적 로딩 + sessionStorage 캐시 구현·검증·커밋 (`9565ccb`)
- [x] 사이드 프로젝트 에이전트 체계 셋업 (CLAUDE.md / STATUS.md / docs/)
- [x] 콜드 응답시간 실측 (Must 1)
- [x] Phase 4 #1 "나중에 읽기 큐" (ADR + 구현 + 검증, `70b6f12`)
- [x] `react-hooks/set-state-in-effect` lint 8건 리팩토링 (`96b07c9`)
- [x] AI 요약 캐시 UX 개선 (`6677b30`)
- [x] README 전면 갱신 (`d24f3e0`)
- [x] Phase 4 #2 "노트 태그" (ADR + 구현 + 검증, `91633bf`)
- [x] arXiv 429 rate limit 대응 (재시도+타임아웃+경고숨김, `aa4fe87`)
- [x] AI 요약 품질 업그레이드 (구조화 심층 요약)

## 직전 작업

**AI 요약 품질 업그레이드.** "요약만 봐도 논문 주요 내용 파악" 목표. 입력은 abstract 유지(레버 1), 출력·추론을 고도화.

- `lib/gemini.ts` — 프롬프트를 단순 3줄 → **구조화 심층 요약**으로: 📌한 줄 / 🎯풀려는 문제 / 🔧핵심 접근 / 📊핵심 결과(수치 포함) / 💡의의. 전문 용어 괄호 풀이, **환각 가드**("abstract에 없는 수치·사실 지어내지 말 것"). 마크다운 기호 금지 → 이모지 헤더+줄바꿈(기존 `whitespace-pre-line` 렌더 그대로, 외부 마크다운 SDK 불필요).
- `thinkingBudget: 0` 제거 → gemini-2.5-flash 기본 동적 thinking 활성으로 추론 품질↑ (응답 ~9s, 캐시되므로 1회만).

검증: `/api/summary` 직접 호출(Attention Is All You Need) — 5섹션·수치 정확(28.4/41.8 BLEU)·용어해설·환각 0. HF 논문 상세(OPRD)에서 UI 렌더 확인 — 이모지 섹션 가독성 우수, 캐시 메타 정상. tsc 통과.

<details><summary>이전: arXiv 429 대응 (aa4fe87)</summary>

피드 "⚠ arXiv 실패" 경고 → 원인은 arXiv IP rate limit 429(카테고리 수 무관). `lib/arxiv.ts` `arxivFetch()`로 백오프 재시도 3회 + 타임아웃 6s(29s→9.3s), `StatusStrip`에서 실패 칩 제거(HF·캐시 폴백). 상세: `docs/learnings.md` (2026-06-05).

</details>

<details><summary>이전: Phase 4 #2 "노트 태그" (91633bf)</summary>

ADR: `docs/decisions.md` (2026-06-04). `lib/tags.ts`로 본문 인라인 `#태그` 파싱(헤딩과 구분, 대소문자 무시). notes 페이지 태그 필터 줄 + 카드 칩. 검증: 빈도순 집계·헤딩 미인식·필터 정확.

</details>

<details><summary>이전: AI 요약 캐시 메타 노출 (6677b30)</summary>

`summaryAt` state를 lazy initializer로 `getSummaries()[id].generatedAt`에서 시드, 요약 본문 아래 "💾 캐시됨 · 날짜시각" 메타. 검증: 최초 생성 시 `POST /api/summary` 1회, reload 후 재호출 0건.

</details>

<details><summary>이전: lint 8건 해소 (useSyncExternalStore 전환)</summary>

`react-hooks/set-state-in-effect` 8건. `lib/storage.ts`에 `useSyncExternalStore` 기반 훅(`useCategories`/`useReadSet`/`useLaterSet`/`useNotes`/`useMeta`/`useHydrated`) 추가, 각 페이지의 effect+setState hydration을 대체. 상세 페이지는 `key={paper.id}` 리마운트 + lazy initializer 시드. 피드는 async 콜백에서만 setState. 패턴 카탈로그: `docs/learnings.md` (2026-06-04). (`96b07c9`)

</details>

<details><summary>이전: Phase 4 #1 "나중에 읽기 큐"</summary>

ADR: `docs/decisions.md` (2026-06-03). `getLaterSet`/`toggleLater` 추가, unread/later/read 상호배타를 토글 함수에서 강제. PaperCard·상세에 "🔖 나중에" 버튼, notes에 탭+카운트+배지. 부수 수정: arXiv `id_list` 버전 suffix(`v1`) 404 버그 → `fetchArxivById`에서 suffix 제거. (`70b6f12`, `e845d80`)

</details>

## 다음 액션

### Must

- 없음 (Phase 4 #1·#2 완료)

### Should

1. **Phase 4 #3 결정** — 남은 후보 중 1개 (키보드 단축키 / 논문 Q&A). ADR 후 진행.
   - 키보드 단축키: 가장 작음, 한 세션 확실. Q&A: AI 심화 방향, 채팅 UI라 시간 여유 필요.

### Could

2. **PWA 매니페스트 기초 작업** — 매니페스트 + 아이콘만이라도 추가 (vision의 PWA 목표 부합, 한 세션에 가능)
3. **`.next/cache` 사이즈 모니터링** — arXiv 응답이 누적되며 폴더가 커지는지 점검
4. **노트 태그 후속** — 상세 페이지 노트 에디터에도 태그 칩 미리보기? (지금은 notes 페이지에만 노출)

## 막힌 부분

- 없음

## 결정 대기 중

- **Phase 4 #3 항목 선택** (키보드 단축키 / 논문 Q&A 중)
- **영어 UI 지원 시점** — vision에 "한국어 우선, 영어는 후순위"로 명시. 도입 시점은 미정.
- **`AGENTS.md`와 새 `CLAUDE.md`의 관계** — 현재 CLAUDE.md가 `@AGENTS.md`로 시작해 룰을 흡수. 향후 AGENTS.md 내용이 늘어나면 통합 또는 분리 재검토 가능.
