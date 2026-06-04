# Learnings

트러블슈팅·배운 점·다음에 또 만날 함정. **한 번 디버깅한 건 다시 디버깅 안 하기 위해** 적는다.

마일스톤 끝의 한 줄 회고도 여기에 누적한다.

## 형식

```
## YYYY-MM-DD — [짧은 제목]

**증상:**
**원인:**
**해결:**
**예방/탐지:**
```

---

## 2026-06-03 — arXiv 단건 조회가 버전 suffix에서 404

**증상:** 피드 카드 클릭 → 상세 페이지가 "논문을 불러올 수 없습니다" (단건 조회 404). 피드 목록에는 멀쩡히 나오는 논문인데 상세만 실패.

**원인:** arXiv `id_list` 파라미터는 **버전 suffix(`v1`, `v2`)를 붙이면 결과가 0건**이 됨.
- `id_list=2606.03990v1` → 0 entries
- `id_list=2606.03990` → 1 entry ✅
- 피드 카드의 `detailHref`는 `paper.id`(=`arxiv:2606.03990v1`)에서 prefix만 떼므로 버전이 남아 상세 URL에 그대로 전달됨 → `fetchArxivById`가 404.

**해결:** `fetchArxivById`에서 `arxivId.replace(/v\d+$/, "")`로 버전 suffix 제거 후 조회 (최신 버전 반환).

**예방/탐지:** arXiv `id_list`에는 절대 버전 suffix를 붙이지 말 것. `search_query`(피드)와 `id_list`(단건)의 ID 포맷 기대가 다름.

## 2026-06-04 — React 19 / Next 16: localStorage 동기화는 useSyncExternalStore로

**증상:** `npm run lint` 가 `react-hooks/set-state-in-effect` 8건으로 실패. `useEffect`에서 localStorage를 읽어 `setHydrated(true)`/`setState`로 hydration하던 패턴이 전부 걸림 (`next build`·`tsc`는 통과).

**원인:** React Compiler 기반 신규 룰 (eslint-plugin-react-hooks v7, recommended preset → `EffectSetState`). effect 동기 실행 경로의 setState를 데이터플로우로 추적해 cascading render 위험으로 막는다. **호출한 함수(`useCallback` 래퍼 포함) 안의 setState까지 추적**하지만 `.then()`/async 콜백·이벤트 핸들러의 setState는 막지 않음. 룰당 effect 하나에 첫 위반만 리포트 → 한 줄 고쳐도 다음 setState가 새로 뜨므로 effect 전체를 정리해야 함.

**해결 (패턴 카탈로그):**
- **읽기 전용 외부(브라우저) 상태** → `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`. getSnapshot은 **참조 안정성 필수**(매번 새 객체 반환하면 무한 렌더) → raw 문자열 기준 스냅샷 캐시. `getServerSnapshot`으로 SSR 폴백 → hydration mismatch 없음, 별도 `hydrated` 플래그 불필요. `useHydrated()`도 같은 훅(`() => true` / `() => false`)으로 구현. (`lib/storage.ts`)
- **편집 가능한 상태**(노트 textarea)는 파생 불가 → 부모를 `key={paper.id}`로 리마운트 + `useState(() => getNotes()[id]...)` lazy initializer로 storage에서 1회 시드. (상세 페이지를 fetch 래퍼 + inner view로 분리)
- **데이터 fetch effect** → 결과를 요청 key로 태깅하고 **async 콜백에서만 setState**. 로딩/캐시 상태는 render에서 파생 (effect 내 동기 setState 0개).

**예방/탐지:** effect 안에서 동기 setState 금지. 외부 store 읽기=uSES, prop 변화로 상태 리셋=key 리마운트, 비동기=콜백. `purity` 룰은 `Date.now`/`Math.random`/`performance.now`만 임퓨어로 막으므로 render/`useMemo`에서 sessionStorage 읽기는 OK(단 freshness용 `Date.now`는 effect로).

## 2026-06-03 — 피드 cold latency 실측

**증상:** 이전 dev 로그에서 `GET /api/feed` 가 10.6s 걸린 적 있어, 점진적 로딩으로 개선했다고 판단했음. 실제 효과 측정 필요.

**측정:**

| 항목 | 시간 |
|---|---|
| 외부 API 직접(curl, 3회 평균) | arXiv 0.70s · HF 0.78s |
| 우리 라우트 cold (`application-code` 기준) | arXiv 0.99s · HF 1.05s |
| 우리 라우트 warm | 4~20ms |

**원인 분석:**

- 10.6초 사례는 arXiv API의 **일시적 폭증**으로 추정 (외부 API 변동성). 평상시엔 두 외부 API 모두 1초 내외라 분리 호출의 평균적 체감 차이는 작음.
- 분리 호출의 진짜 가치는 **arXiv가 느려질 때(가끔 5~10s) HF가 1초에 먼저 도착** → 사용자가 즉시 콘텐츠 보고 arXiv는 backfill. worst-case 개선.
- sessionStorage 캐시는 재방문 즉시 표시로 항상 효과.

**해결:** 분리 호출 + sessionStorage 캐시 그대로 유지. 평균이 아닌 **worst-case + 재방문 UX**가 진짜 효과로 가치 있음.

**예방/탐지:**

- 다음에 "느린데?" 의심이 들면 dev 로그의 `application-code: Xs` 값을 직접 보고 외부 API 응답인지 우리 코드인지 구분.
- **dev mode fetch cache는 in-memory.** `.next/cache` 삭제만으로는 안 비워지고 **서버 재시작이 필요**. (콜드 측정 시 주의)
- `until curl http://localhost:3000/`로 ready 체크 하면 client component가 자동으로 첫 fetch를 보내므로 직후의 curl 측정은 두 번째 호출(캐시 히트)임. 진짜 콜드 측정은 dev log의 첫 라인을 봐야 함.
