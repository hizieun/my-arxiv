# STATUS

**마지막 업데이트:** 2026-06-04

## 한 줄

AI 요약 레버 2 — arXiv 본문(HTML) 전문을 가져와 본문 기반 심층 요약(폴백 포함). 직전: 레버 1 구조화 심층 요약.

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
- [x] AI 요약 품질 업그레이드 — 레버 1 구조화 심층 요약 (`ed6041a`)
- [x] AI 요약 레버 2 — arXiv 본문(HTML) 기반 심층 요약 + 폴백

## 직전 작업

**AI 요약 레버 2 — 본문 기반 요약.** ADR: `docs/decisions.md` (2026-06-05). arXiv 전문을 입력에 넣어 abstract엔 없는 방법·실험 디테일까지 반영.

- `lib/arxiv.ts` `fetchArxivFulltext()` (신규) — `arxiv.org/html/{id}`에서 정규식으로 본문 추출(`<article>`→bibliography/math/태그 제거→엔티티 디코드, 길이 상한 45k자). HTML 없음·과소·실패 시 `null`.
- `lib/gemini.ts` `summarizePaper({title, abstract, fulltext?})` — fulltext 있으면 본문 프롬프트, 없으면 abstract 프롬프트. 503/과부하 일시 오류 1s→2s 백오프 재시도 3회.
- `app/api/summary/route.ts` — `paperId`→`extractArxivId`→`fetchArxivFulltext` 시도, 실패 시 abstract 폴백. 응답에 `mode`("fulltext"|"abstract").
- `lib/storage.ts` `saveSummary(id, text, mode?)` + 상세 페이지 "📄 본문 기반" 배지(emerald).

검증: Mistral 7B(`/api/summary`) — mode fulltext, abstract엔 없던 GQA/SWA 작동·윈도우 수식·캐시 8배 감소 등 디테일 반영. OPRD UI — 손실함수 수식·28레이어 등 + 배지 렌더 OK. 폴백(존재X id) — mode abstract 정상. tsc/lint 통과. 상세: `docs/learnings.md` (2026-06-18).

<details><summary>이전: AI 요약 레버 1 구조화 심층 요약 (ed6041a)</summary>

프롬프트를 단순 3줄 → 구조화 5섹션(📌🎯🔧📊💡) + 환각 가드 + 용어 풀이. `thinkingBudget: 0` 제거(동적 thinking). 이모지 헤더+줄바꿈으로 마크다운 SDK 없이 렌더. 검증: Attention 논문 5섹션·수치 정확.

</details>

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
