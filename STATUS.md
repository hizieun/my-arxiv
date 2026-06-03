# STATUS

**마지막 업데이트:** 2026-06-03

## 한 줄

피드 점진적 로딩 + sessionStorage 캐시 커밋 완료(`9565ccb`). 사이드 프로젝트 에이전트 체계 셋업 마무리 중.

## 이번 주 목표

- [x] Gemini 한국어 요약 기능 추가 (`gemini-2.5-flash`, quota 0 이슈 해결)
- [x] 피드 점진적 로딩 + sessionStorage 캐시 구현·검증·커밋 (`9565ccb`)
- [x] 사이드 프로젝트 에이전트 체계 셋업 (CLAUDE.md / STATUS.md / docs/)

## 직전 작업

피드 콜드 로드가 10초+ 걸리던 문제를 점진적 로딩 + 클라이언트 캐시로 개선해 커밋(`9565ccb`):

- `app/api/feed/route.ts` — `?source=arxiv|hf` 분리 호출 지원
- `app/page.tsx` — HF·arXiv 병렬 fetch, 먼저 도착하는 쪽 즉시 렌더 + `StatusStrip`로 부분 로딩 표시
- `lib/storage.ts` — sessionStorage 기반 `getFeedCache`/`setFeedCache` (TTL 30분)
- 클라이언트에서 `dedupAndSort` 직접 호출

검증: 페이지 정상 렌더, dedup 동작 확인, 머지 카드(📅 + 🔥) 노출 OK. 콜드 응답시간 실측은 미완료(`.next/cache` 디스크 캐시 때문에 캐시 히트만 잡힘).

## 다음 액션

### Must

1. **콜드 응답시간 실측** — `.next/cache` 비우고 HF vs arXiv 외부 API 응답 시간 수치화. 점진적 로딩 효과를 STATUS에 기록.

### Should

2. **AI 요약 캐시 UX 개선** — 현재 localStorage에 캐시되어 있지만, 같은 논문 재방문 시 "재생성" 버튼이 항상 보임. "캐시됨 ✓ · YYYY-MM-DD" 메타 노출.
3. **Phase 4 첫 항목 결정** — vision/roadmap과 정렬해서 1개 선택 (후보: 나중에 읽기 / 노트 태그 / 키보드 단축키 / 논문 Q&A). ADR 작성 후 진행.

### Could

4. **PWA 매니페스트 기초 작업** — 매니페스트 + 아이콘만이라도 추가 (vision의 PWA 목표 부합, 한 세션에 가능)
5. **`.next/cache` 사이즈 모니터링** — arXiv 응답이 누적되며 폴더가 커지는지 점검

## 막힌 부분

- 없음

## 결정 대기 중

- **Phase 4의 첫 번째 항목 선택** (사용자 결정 필요)
- **영어 UI 지원 시점** — vision에 "한국어 우선, 영어는 후순위"로 명시. 도입 시점은 미정.
- **`AGENTS.md`와 새 `CLAUDE.md`의 관계** — 현재 CLAUDE.md가 `@AGENTS.md`로 시작해 룰을 흡수. 향후 AGENTS.md 내용이 늘어나면 통합 또는 분리 재검토 가능.
