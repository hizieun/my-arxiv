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
