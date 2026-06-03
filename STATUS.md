# STATUS

**마지막 업데이트:** 2026-06-03

## 한 줄

피드 콜드 응답시간 실측 완료. 평상시 1초 내외, worst-case 5~10s. 분리 호출의 가치는 worst-case 개선 + 재방문 UX (`docs/learnings.md` 참고).

## 이번 주 목표

- [x] Gemini 한국어 요약 기능 추가 (`gemini-2.5-flash`, quota 0 이슈 해결)
- [x] 피드 점진적 로딩 + sessionStorage 캐시 구현·검증·커밋 (`9565ccb`)
- [x] 사이드 프로젝트 에이전트 체계 셋업 (CLAUDE.md / STATUS.md / docs/)
- [x] 콜드 응답시간 실측 (Must 1)

## 직전 작업

콜드 응답시간 실측 완료. `.next` 전체 삭제 + 서버 재시작 후 측정.

| 항목 | 시간 |
|---|---|
| 외부 API 직접(curl, 3회 평균) | arXiv 0.70s · HF 0.78s |
| 우리 라우트 cold (`application-code`) | arXiv 0.99s · HF 1.05s |
| 우리 라우트 warm | 4~20ms |

**결론:** 평상시엔 두 소스 모두 1초 내외로 분리 호출의 평균적 효과는 작음. 진짜 가치는 **arXiv가 느려질 때(worst-case 5~10s) HF가 먼저 도착해 사용자가 즉시 콘텐츠 보기** + **sessionStorage 캐시로 재방문 즉시 표시**. 상세는 `docs/learnings.md`.

dev mode fetch cache는 in-memory라 `.next/cache` 삭제만으론 안 비워짐 → 콜드 측정 시 서버 재시작 필수. 이 점도 learnings에 기록.

## 다음 액션

### Must

1. **Phase 4 첫 항목 결정** — vision/roadmap과 정렬해서 1개 선택. ADR 작성 후 진행.
   - 후보: 나중에 읽기 큐 / 노트 태그 / 키보드 단축키 / 논문 Q&A
   - 한 세션에 끝낼 수 있는 단위인지 분해 검토 필요

### Should

2. **AI 요약 캐시 UX 개선** — 현재 localStorage에 캐시되어 있지만, 같은 논문 재방문 시 "재생성" 버튼이 항상 보임. "캐시됨 ✓ · YYYY-MM-DD" 메타 노출.

### Could

3. **PWA 매니페스트 기초 작업** — 매니페스트 + 아이콘만이라도 추가 (vision의 PWA 목표 부합, 한 세션에 가능)
4. **`.next/cache` 사이즈 모니터링** — arXiv 응답이 누적되며 폴더가 커지는지 점검

## 막힌 부분

- 없음

## 결정 대기 중

- **Phase 4의 첫 번째 항목 선택** (사용자 결정 필요)
- **영어 UI 지원 시점** — vision에 "한국어 우선, 영어는 후순위"로 명시. 도입 시점은 미정.
- **`AGENTS.md`와 새 `CLAUDE.md`의 관계** — 현재 CLAUDE.md가 `@AGENTS.md`로 시작해 룰을 흡수. 향후 AGENTS.md 내용이 늘어나면 통합 또는 분리 재검토 가능.
