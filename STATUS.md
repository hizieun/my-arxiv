# STATUS

**마지막 업데이트:** 2026-06-23

## 한 줄

**UX/UI 정제 라운드 완료** (NavBar 반응형·삭제 확인·제출 pending·상대 시각). 직전: Q&A 캐싱 + PWA 오프라인 2차. tsc·lint·build 통과, 배포.

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
- [x] AI 요약 레버 2 — arXiv 본문(HTML) 기반 심층 요약 + 폴백 (`f7fea58`)
- [x] 본문 요약 응답시간 단축 (긴 논문 타임아웃 실패 해소, `9dfbaba`)
- [x] PWA 1차 — 설치 가능 (manifest + 코드 생성 아이콘)

## 직전 작업

**UX/UI 정제 (2026-06-26, `3b1c620`).** 기획자 관점 점검 후 우선순위(1>2>3>4)대로.

- **NavBar 반응형** — 브랜드/인증 고정 + 링크 가로 스크롤(스크롤바 숨김)로 모바일 오버플로우 해소.
- **삭제 확인** — `ConfirmButton`(client): 글/댓글 삭제 전 `window.confirm`.
- **제출 pending** — `SubmitButton`/`ConfirmButton`이 `useFormStatus`로 제출 중 비활성+문구(중복 제출 방지). 글쓰기·수정·댓글·삭제 적용.
- **상대 시각** — `lib/time.ts` `timeAgo`/`absoluteTime`. 커뮤니티 목록·상세·프로필·노트·댓글에 "N일 전"(title=절대시각).
- 보류(P3): focus-visible 링, 좋아요 옵티미스틱, 칩 스타일 통일.

검증: tsc/lint/build 통과.

<details><summary>이전: Q&A 캐싱 + PWA 오프라인 2차 (2026-06-26)</summary>

**Q&A 캐싱 + PWA 오프라인 2차 (2026-06-26).** 우선순위: Q&A 캐싱(퀵윈) > PWA(큰 돌), 댓글 가중치·알림 보류. 커밋 3900614 / ece122f.

- **① Q&A 캐싱** — `lib/storage.ts` `getQA`/`saveQA`+`QAEntry`(요약 캐시와 동일 패턴). PaperQA lazy init 시드(재방문 즉시), 답변마다 영속, 기록 지우기. paper.id key 리마운트라 안전.
- **② PWA 오프라인 2차(수동 SW)** — ADR(`docs/decisions.md` 2026-06-26): next-pwa 미도입(외부 의존성 최소 + Serwist/next-pwa는 webpack 필요, 우린 Turbopack). `public/sw.js`(정적 cache-first / 네비 network-first+폴백, /api·/auth·외부 제외, activate 옛 캐시 정리), `ServiceWorkerRegister`(프로덕션만), `next.config.ts` /sw.js no-cache 헤더.

검증: tsc/lint/build 통과, 배포 완료. 오프라인 실동작 확인됨(v3에서 RSC/manifest 캐시까지). SW 캐시 버전 현재 v3.

</details>

<details><summary>이전: 커뮤니티 마무리 + 이미지/Q&A/단축키 (2026-06-25)</summary>

**커뮤니티 마무리 + 이미지/Q&A/단축키 (2026-06-25).** 우선순위: 이미지>Q&A>단축키, PWA 오프라인은 보류(ADR/의존성 선행). 기능별 커밋(c8b5016 이미지 / 48eec71 Q&A / 8238367 단축키, 앞서 9ee742c 마무리).

- **커뮤니티 마무리** — 피드 카드 💬댓글수, 최신순/🔥인기순(좋아요) 토글, "내 글"(본인 프로필), 태그 빈상태.
- **① 이미지 업로드** — `supabase/storage.sql`(post-images 공개 버킷+RLS: 공개읽기/본인 폴더 업로드/본인 삭제). PostForm "🖼 이미지" → 브라우저 업로드 후 커서에 `![](url)` 삽입(타입·5MB 검증). Markdown img 스타일.
- **② 논문 Q&A** — `lib/gemini.ts`에 `generateWithRetry` 추출+`answerQuestion`, `app/api/qa/route.ts`(fulltext→abstract 폴백), `components/PaperQA.tsx`(상세 Q&A 섹션, 세션 히스토리). 환각 가드.
- **③ 키보드 단축키** — `lib/useFeedKeyboard.ts`(j/k 이동·Enter/o 열기, 입력 포커스 시 무시), PaperCard `selected` ring, 피드 힌트. (lint: 렌더 중 ref 쓰기 금지 → count를 effect deps로.)

검증: tsc/lint/build 통과. **DB: `supabase/storage.sql` 실행 필요(미실행 시 업로드만 실패, 나머지 정상).** Q&A·단축키는 추가 세팅 불필요. (storage.sql 실행·이미지 업로드 실검증 완료)

</details>

<details><summary>이전: Phase 5 커뮤니티 후속 #1~#4 (2026-06-23)</summary>

**Phase 5 커뮤니티 후속 #1~#4 (2026-06-23).** 기능별 커밋(82166a0 댓글 / f5e12fe 좋아요 / bfad5cb 프로필 / 9e9b849 논문연결).

- **#1 댓글** — `comments` 테이블+RLS(누구나 읽기·로그인 작성·본인 삭제). 상세 페이지에 목록+작성폼(서버액션), 테이블 없어도 `[]` 폴백. `addComment`/`deleteComment`.
- **#2 좋아요** — `likes`(복합 PK 1인1좋아요)+RLS. `toggleLike` 서버액션, `LikeButton`(서버액션 폼, ♥/♡+카운트). 작은 커뮤니티 전제로 likes 전체 1회 조회 후 JS 집계(카운터 컬럼/뷰/트리거 없음 — 과설계 회피).
- **#3 프로필** — `/u/[username]`. 아바타/가입일/글수+글목록. 작성자명 클릭 시 이동. `LikeButton`에 `from` prop 추가해 토글 후 현재 경로도 revalidate.
- **#4 논문→글쓰기** — 논문 상세 "✍️ 이 논문으로 학습 글 쓰기" → `/community/new?title=&body=&tags=` 프리필. new 페이지가 searchParams 받아 PostForm initial 시드. (테이블 변경 없음)

검증: tsc/lint/build 모두 통과. **DB: `comments`/`likes` 테이블은 사용자가 `supabase/schema.sql` 재실행(또는 4·5번 블록만) 필요.** 미실행 상태에선 댓글=빈목록, 좋아요=0으로 graceful 동작. (실행·배포·PGRST201 픽스 완료)

</details>

<details><summary>이전: Phase 5 커뮤니티 1차 (코드 완성, 2026-06-23)</summary>

**Phase 5 커뮤니티 1차 (코드 완성, 2026-06-23).** ADR: `docs/decisions.md` (2026-06-23) 2건(Supabase 피벗 / react-markdown).

- 의존성: `@supabase/supabase-js`, `@supabase/ssr`, `react-markdown`, `remark-gfm`.
- Supabase 레이어: `lib/supabase/{client,server,middleware}.ts` + 루트 `proxy.ts`(Next 16에서 middleware→**proxy** 리네임 확인, `proxy` export + matcher로 세션 갱신).
- DB: `supabase/schema.sql` — `profiles`/`posts`, RLS(누구나 읽기·본인 글만 수정/삭제), 가입 시 프로필 자동생성 트리거(GitHub `user_name`/`avatar_url` 시드), `updated_at` 트리거.
- 인증: `app/auth/callback/route.ts`(코드→세션 교환), `app/login/page.tsx`(GitHub OAuth, `useSearchParams`는 Suspense로 감쌈), `NavBar`에 인증 상태(@username/로그아웃) + Community 링크.
- 글 CRUD: `app/community/`(목록·new·[id]·[id]/edit) + `actions.ts`(create/update/delete, 서버에서 `author_id` 재확인 이중 방어) + `components/{Markdown,PostForm}.tsx`(미리보기 토글).
- 기존 arXiv/노트/요약/PWA는 **무변경** (localStorage 그대로).

검증: `tsc --noEmit` OK, `lint` OK, `next build` OK(커뮤니티 라우트 4 + auth 콜백 + Proxy 등록 확인). 배포·로그인·글 작성까지 프로덕션 end-to-end 확인 완료(https://my-arxiv.vercel.app).

</details>

<details><summary>이전: PWA 1차 — 홈 화면 설치 가능</summary>

**PWA 1차 — 홈 화면 설치 가능.** ADR: `docs/decisions.md` (2026-06-18). vision의 "PWA 설치 가능하게" 목표, roadmap 7월 테마.

- `app/icon.tsx`(512)·`app/apple-icon.tsx`(180) — `ImageResponse`(next/og)로 아이콘 **코드 생성** (accent #2563eb 배경 + 📚). 외부 PNG 자산·도구 불필요.
- `app/manifest.ts` — Next 메타데이터 라우트. `display: standalone`, theme `#2563eb`, bg `#fafafa`, icons → `/icon`.
- `app/layout.tsx` — `viewport.themeColor`(Next 16은 metadata→viewport 이동) + `metadata.appleWebApp`.

검증(브라우저): manifest.webmanifest 200(application/manifest+json), /icon·/apple-icon PNG 생성·📚 렌더 확인, head에 manifest·apple-touch-icon·theme-color·web-app-capable 자동 주입. localhost secure context로 설치 조건 충족. tsc/lint 통과.

</details>

<details><summary>이전: 본문 요약 응답시간 단축 (9dfbaba)</summary>

긴 논문(본문 628KB)에서 Gemini ~30s → Vercel 타임아웃으로 "요약 실패". `thinkingBudget: 2048` + `maxOutputTokens: 4096` + 본문 상한 45k→28k + route `maxDuration = 60`. 결과 30s→15s, 출력 4000자→1408자, 품질 유지. 상세: `docs/learnings.md` (2026-06-18).

</details>

<details><summary>이전: AI 요약 레버 2 본문 기반 요약 (f7fea58)</summary>

ADR: `docs/decisions.md` (2026-06-05). arXiv 전문을 입력에 넣어 abstract엔 없는 방법·실험 디테일까지 반영.

- `lib/arxiv.ts` `fetchArxivFulltext()` (신규) — `arxiv.org/html/{id}`에서 정규식으로 본문 추출(`<article>`→bibliography/math/태그 제거→엔티티 디코드, 길이 상한 45k자). HTML 없음·과소·실패 시 `null`.
- `lib/gemini.ts` `summarizePaper({title, abstract, fulltext?})` — fulltext 있으면 본문 프롬프트, 없으면 abstract 프롬프트. 503/과부하 일시 오류 1s→2s 백오프 재시도 3회.
- `app/api/summary/route.ts` — `paperId`→`extractArxivId`→`fetchArxivFulltext` 시도, 실패 시 abstract 폴백. 응답에 `mode`("fulltext"|"abstract").
- `lib/storage.ts` `saveSummary(id, text, mode?)` + 상세 페이지 "📄 본문 기반" 배지(emerald).

검증: Mistral 7B(`/api/summary`) — mode fulltext, abstract엔 없던 GQA/SWA 작동·윈도우 수식·캐시 8배 감소 등 디테일 반영. OPRD UI — 손실함수 수식·28레이어 등 + 배지 렌더 OK. 폴백(존재X id) — mode abstract 정상. tsc/lint 통과. 상세: `docs/learnings.md` (2026-06-18).

</details>

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

- 없음. (커뮤니티·이미지·Q&A·단축키·PWA 1·2차 코드/세팅 모두 완료)

### Should

1. **PWA 오프라인 수동 점검** — 배포본 모바일/DevTools(Application→Service Workers 등록 확인, Network=Offline에서 마지막 피드/노트 열람) 동작 확인. 헤드리스 검증 불가라 직접 점검만 남음.
2. **(보류) 알림 / 인기순 댓글 가중치** — 현 소규모 단계엔 효용 대비 비용 미스매치라 보류.

<details><summary>완료: 커뮤니티/이미지 가동 (Supabase 세팅)</summary>

Supabase 프로젝트·스키마·OAuth·환경변수 + comments/likes 테이블 + Storage(post-images) 모두 실행. 로그인→글·댓글·좋아요·이미지 업로드 프로덕션 검증됨.
</details>

### Could

3. **`.next/cache` 사이즈 모니터링** — arXiv 응답이 누적되며 폴더가 커지는지 점검
4. **노트 태그 후속** — 상세 페이지 노트 에디터에도 태그 칩 미리보기? (지금은 notes 페이지에만 노출)
5. **Q&A 캐시 메타·인기순 댓글 가중치** 등 소소한 다듬기

## 막힌 부분

- 없음

## 결정 대기 중

- **커뮤니티 후속 범위** — 댓글 / 좋아요 / 프로필 페이지(`/u/[username]`) / 논문 상세→글쓰기 연결 중 우선순위.
- **인증 방식 확정** — GitHub OAuth(현재) vs 매직링크. OAuth 앱 세팅 부담되면 매직링크로 스왑.
- **공개 오픈 커뮤니티 여부** — 소규모 검증 후 결정(모더레이션·스팸 대응 필요해짐).
- **PWA 2차 도입 여부** — 서비스워커(오프라인). `next-pwa` 의존성 vs 수동 SW.
- **남은 Phase 4 후보 우선순위** (키보드 단축키 / 논문 Q&A)
- **영어 UI 지원 시점** — vision에 "한국어 우선, 영어는 후순위"로 명시. 도입 시점은 미정.
- **`AGENTS.md`와 새 `CLAUDE.md`의 관계** — 현재 CLAUDE.md가 `@AGENTS.md`로 시작해 룰을 흡수. 향후 AGENTS.md 내용이 늘어나면 통합 또는 분리 재검토 가능.
