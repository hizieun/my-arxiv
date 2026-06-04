# Ideas — Inbox

떠오른 아이디어를 적는 곳. **즉시 구현 결정 없이** 우선 적기. 평가는 나중에.

## 형식

```
- YYYY-MM-DD — [한 줄 설명] (status: new | considered | scheduled | discarded)
```

`scheduled` 상태가 되면 `roadmap.md` 또는 `STATUS.md`의 다음 액션으로 옮긴다.
`discarded`는 vision의 비목표에 부합하지 않거나, 비용 대비 효용이 낮다고 판단된 것. **삭제하지 말고 상태만 변경** — 다음에 같은 아이디어가 다시 떠올랐을 때 기왕의 판단을 빠르게 복기할 수 있게.

---

- 2026-06-03 — effect 내 동기 setState 8곳 리팩토링 (`react-hooks/set-state-in-effect` lint 에러). Next 16/React 19 신규 룰. `next build`는 막지 않지만 `npm run lint`는 실패. hydration 패턴(`setHydrated(true)`)을 effect 밖으로 빼거나 다른 방식으로 정리 필요. 8곳: categories/notes/page/paper 페이지 + PaperCard. (status: done — 2026-06-04) → localStorage 읽기를 `useSyncExternalStore` 훅(`lib/storage.ts`)으로 전환, 상세 페이지는 `key` 리마운트 + lazy init, 피드 fetch는 async 콜백에서만 setState. lint/tsc/build 통과, 브라우저 회귀 검증 완료. 패턴은 `docs/learnings.md` 참조.
