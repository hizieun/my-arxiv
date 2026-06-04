# STATUS

**마지막 업데이트:** 2026-06-04

## 한 줄

`react-hooks/set-state-in-effect` lint 8건 해소 — localStorage hydration 패턴을 `useSyncExternalStore`로 전환. lint/tsc/build 통과 + 브라우저 회귀 검증 완료.

## 이번 주 목표

- [x] Gemini 한국어 요약 기능 추가 (`gemini-2.5-flash`, quota 0 이슈 해결)
- [x] 피드 점진적 로딩 + sessionStorage 캐시 구현·검증·커밋 (`9565ccb`)
- [x] 사이드 프로젝트 에이전트 체계 셋업 (CLAUDE.md / STATUS.md / docs/)
- [x] 콜드 응답시간 실측 (Must 1)
- [x] Phase 4 #1 "나중에 읽기 큐" (ADR + 구현 + 검증, `70b6f12`)
- [x] `react-hooks/set-state-in-effect` lint 8건 리팩토링

## 직전 작업

**`react-hooks/set-state-in-effect` lint 8건 해소.** React 19/Next 16 신규 룰. `next build`는 통과하지만 `npm run lint` 실패 상태였음.

- `lib/storage.ts` — `useSyncExternalStore` 기반 훅 추가 (`useCategories`/`useReadSet`/`useLaterSet`/`useNotes`/`useMeta`/`useHydrated`). raw 문자열 기준 스냅샷 캐시로 참조 안정성 확보, `getServerSnapshot`으로 SSR 폴백 → `hydrated` 플래그·effect setState 제거.
- `categories`/`notes` 페이지·`PaperCard` — effect+setState hydration을 위 훅으로 대체. 읽음/나중에/노트 토글은 storage 쓰기 → `STORAGE_EVENT` → 훅 재구독으로 자동 반영.
- 상세 페이지(`app/paper/.../page.tsx`) — fetch 래퍼 + `key={paper.id}` inner view로 분리. 편집 가능한 노트/요약은 lazy initializer로 storage에서 1회 시드 (리마운트로 리시드).
- 피드(`app/page.tsx`) — fetch 결과를 cacheKey로 태깅, **async 콜백에서만 setState**. 로딩/캐시 표시는 render에서 파생. (참고: 기존 `cacheFresh` 분기는 직후 `setHfState("loading")`에 항상 덮여 죽은 코드였음 → 제거)

검증: lint 0건 · `tsc --noEmit` 통과 · `next build` 성공. 브라우저(preview)에서 피드 로딩/캐시 시드, 읽음·나중에 토글+상호배타, 노트 저장·• 표시, 카테고리 토글+카운트, 상세 read/note 시드·key 리시드, notes 페이지 카운트 모두 OK. 콘솔 에러·hydration mismatch 0건. 패턴 카탈로그는 `docs/learnings.md` (2026-06-04).

<details><summary>이전: Phase 4 #1 "나중에 읽기 큐"</summary>

구현 완료. ADR: `docs/decisions.md` (2026-06-03).

- `lib/storage.ts` — `getLaterSet`/`toggleLater`/`getReadingStatus` 추가. unread/later/read 상호배타를 토글 함수에서 강제 (read↔later 전환 시 반대편 Set에서 자동 제거). 기존 `getReadSet`/`toggleRead` API 보존.
- `components/PaperCard.tsx` — "🔖 나중에" 버튼 (amber 톤)
- `app/notes/page.tsx` — "🔖 나중에" 탭 + 카운트 + 배지
- `app/paper/[source]/[id]/page.tsx` — 상세 페이지 "나중에" 버튼

검증: 카드/notes/상세 3곳에서 토글·상호배타·필터 모두 OK (storage + UI 양쪽). typecheck 통과.

**부수 발견·수정:** arXiv `id_list`는 버전 suffix(`v1`)를 붙이면 0건 반환 → 피드 카드가 버전 포함 ID를 상세 URL로 넘겨 단건조회가 항상 404였음. `fetchArxivById`에서 suffix 제거로 수정. (`docs/learnings.md`)

</details>

## 다음 액션

### Must

- 없음 (Phase 4 #1 완료)

### Should

1. **AI 요약 캐시 UX 개선** — 현재 localStorage에 캐시되어 있지만, 같은 논문 재방문 시 "재생성" 버튼이 항상 보임. "캐시됨 ✓ · YYYY-MM-DD" 메타 노출.
2. **Phase 4 #2 결정** — 남은 후보 중 1개 (노트 태그 / 키보드 단축키 / 논문 Q&A). ADR 후 진행.

### Could

3. **PWA 매니페스트 기초 작업** — 매니페스트 + 아이콘만이라도 추가 (vision의 PWA 목표 부합, 한 세션에 가능)
4. **`.next/cache` 사이즈 모니터링** — arXiv 응답이 누적되며 폴더가 커지는지 점검
5. **README 갱신** — "나중에 읽기" 기능 반영 (기능 표 + 로드맵)

## 막힌 부분

- 없음

## 결정 대기 중

- **Phase 4 #2 항목 선택** (노트 태그 / 키보드 단축키 / 논문 Q&A 중)
- **영어 UI 지원 시점** — vision에 "한국어 우선, 영어는 후순위"로 명시. 도입 시점은 미정.
- **`AGENTS.md`와 새 `CLAUDE.md`의 관계** — 현재 CLAUDE.md가 `@AGENTS.md`로 시작해 룰을 흡수. 향후 AGENTS.md 내용이 늘어나면 통합 또는 분리 재검토 가능.
