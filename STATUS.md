# STATUS

**마지막 업데이트:** 2026-06-04

## 한 줄

README 전면 갱신 (AI 요약·나중에 읽기·점진적 로딩·환경변수·디렉토리·로드맵 진행상황 반영). 직전: AI 요약 캐시 메타 노출.

## 이번 주 목표

- [x] Gemini 한국어 요약 기능 추가 (`gemini-2.5-flash`, quota 0 이슈 해결)
- [x] 피드 점진적 로딩 + sessionStorage 캐시 구현·검증·커밋 (`9565ccb`)
- [x] 사이드 프로젝트 에이전트 체계 셋업 (CLAUDE.md / STATUS.md / docs/)
- [x] 콜드 응답시간 실측 (Must 1)
- [x] Phase 4 #1 "나중에 읽기 큐" (ADR + 구현 + 검증, `70b6f12`)
- [x] `react-hooks/set-state-in-effect` lint 8건 리팩토링 (`96b07c9`)
- [x] AI 요약 캐시 UX 개선

## 직전 작업

**AI 요약 캐시 UX 개선.** 같은 논문 재방문 시 캐시된 요약이 즉시 뜨는데도 그 사실이 UI에 드러나지 않던 문제 해소.

- `app/paper/[source]/[id]/page.tsx` — `summaryAt` state 추가 (lazy initializer로 `getSummaries()[id].generatedAt` 시드). 요약 본문 아래 "💾 캐시됨 · {날짜시각} (재호출 없이 저장된 요약 표시 중)" 메타 줄. 생성 직후엔 `saveSummary` 후 storage를 다시 읽어 정확한 timestamp로 갱신.
- `generatedAt`은 기존 `SummaryMap` 스키마에 이미 있어 데이터 변경 불필요.

검증(브라우저): 최초 생성 → `POST /api/summary` 1회 + "캐시됨" 메타 표시. **reload 후 요약·메타 즉시 표시되며 `/api/summary` 재호출 0건** (서버 로그 확인). lint/tsc 통과.

<details><summary>이전: lint 8건 해소 (useSyncExternalStore 전환)</summary>

`react-hooks/set-state-in-effect` 8건. `lib/storage.ts`에 `useSyncExternalStore` 기반 훅(`useCategories`/`useReadSet`/`useLaterSet`/`useNotes`/`useMeta`/`useHydrated`) 추가, 각 페이지의 effect+setState hydration을 대체. 상세 페이지는 `key={paper.id}` 리마운트 + lazy initializer 시드. 피드는 async 콜백에서만 setState. 패턴 카탈로그: `docs/learnings.md` (2026-06-04). (`96b07c9`)

</details>

<details><summary>이전: Phase 4 #1 "나중에 읽기 큐"</summary>

ADR: `docs/decisions.md` (2026-06-03). `getLaterSet`/`toggleLater` 추가, unread/later/read 상호배타를 토글 함수에서 강제. PaperCard·상세에 "🔖 나중에" 버튼, notes에 탭+카운트+배지. 부수 수정: arXiv `id_list` 버전 suffix(`v1`) 404 버그 → `fetchArxivById`에서 suffix 제거. (`70b6f12`, `e845d80`)

</details>

## 다음 액션

### Must

- 없음 (Phase 4 #1 완료)

### Should

1. **Phase 4 #2 결정** — 남은 후보 중 1개 (노트 태그 / 키보드 단축키 / 논문 Q&A). ADR 후 진행.

### Could

2. **PWA 매니페스트 기초 작업** — 매니페스트 + 아이콘만이라도 추가 (vision의 PWA 목표 부합, 한 세션에 가능)
3. **`.next/cache` 사이즈 모니터링** — arXiv 응답이 누적되며 폴더가 커지는지 점검

## 막힌 부분

- 없음

## 결정 대기 중

- **Phase 4 #2 항목 선택** (노트 태그 / 키보드 단축키 / 논문 Q&A 중)
- **영어 UI 지원 시점** — vision에 "한국어 우선, 영어는 후순위"로 명시. 도입 시점은 미정.
- **`AGENTS.md`와 새 `CLAUDE.md`의 관계** — 현재 CLAUDE.md가 `@AGENTS.md`로 시작해 룰을 흡수. 향후 AGENTS.md 내용이 늘어나면 통합 또는 분리 재검토 가능.
