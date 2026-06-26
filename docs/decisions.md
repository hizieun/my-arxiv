# Decisions (ADR)

큰 선택의 근거 기록. "왜 X 대신 Y인가."

작은 변경(파일명·스타일·짧은 리팩토링)은 여기에 적지 않는다. **취소 비용이 큰 결정**만.

## 형식

```
## YYYY-MM-DD — [짧은 제목]

**상황:**
**옵션:**
**선택:**
**근거:**
**트레이드오프:**
**나중에 재검토할 조건:**
```

---

## 2026-06-26 — PWA 오프라인 2차: 수동 서비스워커 (next-pwa 미도입)

**상황:**
PWA 1차(설치 가능)는 됐고, 2차로 오프라인 캐시(마지막 피드/노트를 오프라인에서 열람) 도입. 서비스워커가 필요한데 Next 16은 기본 SW를 제공하지 않음.

**옵션:**
- A. **수동 경량 SW** (`public/sw.js` 직접 작성 + 클라이언트에서 등록)
- B. `next-pwa`(또는 `@ducanh2912/next-pwa`) 의존성 도입 — Workbox 기반 자동 생성
- C. `serwist` 등 Workbox 래퍼

**선택:** A. 수동 경량 SW.

**근거:**
- vision의 핵심 원칙이 **"외부 의존성 최소"** (arXiv Atom XML도 외부 파서 없이 정규식으로 자체 구현). next-pwa는 Turbopack/Next 16 호환·빌드 통합 이슈와 Workbox 블랙박스를 떠안음.
- 우리가 필요한 건 단순함: 정적 자산 cache-first + 페이지 네비게이션 network-first(캐시 폴백). 60~80줄 수동 SW로 충분.
- 개인 데이터는 이미 localStorage(클라이언트)라, 앱 셸(HTML/JS)만 캐시되면 오프라인에서 마지막 상태가 뜬다. 동적/인증 요청(arXiv·HF·Supabase·Gemini)은 캐시하지 않음.

**트레이드오프:**
- Workbox의 정교한 전략(만료·정밀 라우팅)은 수동 구현이 약함 → 단순 전략으로 감수.
- SW 캐시 무효화는 캐시 버전 문자열 수동 관리. 잘못하면 stale → activate에서 옛 캐시 정리 + 버전 bump 규칙으로 대응.
- 오프라인 동작은 헤드리스 검증이 어려워 기기/DevTools(Offline) 수동 점검 필요.

**나중에 재검토할 조건:**
- 캐시 전략이 복잡해지거나(부분 오프라인, 백그라운드 동기화) 버그가 잦아지면 serwist/next-pwa 재고.

---

## 2026-06-23 — 커뮤니티 피벗 + Supabase 도입

**상황:**
지금까지 1인용·localStorage 전용 앱이었고 vision에도 "멀티유저는 명시적 비목표"로 적혀 있었다. 사용자가 **각자 공부한 내용(자유 학습 글/TIL, 마크다운)을 올리고 공유하는 커뮤니티**로 확장하기로 결정 → 서버 DB·인증·계정이 처음으로 필요해짐.

**옵션 (백엔드):**
- A. **Supabase** — Postgres + Auth + Storage 한 묶음, RLS로 권한, Vercel 궁합·무료 티어
- B. Vercel Postgres + Auth.js(NextAuth) — Vercel 생태계 통일, 인증/스토리지 직접 조립
- C. 자체 백엔드(별도 서버) — 과함

**선택:** A. Supabase. 인증은 **GitHub OAuth** (개발자 커뮤니티에 적합, 매직링크로 스왑 가능).

**근거:**
- 인증 + DB + (향후) 파일 스토리지를 한 곳에서 → 사이드 프로젝트 시간 제약에 최적.
- **RLS(Row Level Security)** 로 "누구나 읽기 / 본인 글만 수정·삭제"를 DB 레벨에서 강제 → 서버 액션 버그가 있어도 권한이 새지 않음 (서버 액션에서 `author_id` 한 번 더 확인해 이중 방어).
- `@supabase/ssr`로 App Router 쿠키 세션 처리 공식 지원.
- 기존 arXiv/노트 기능은 localStorage 그대로 유지, 커뮤니티는 순수 부가 → 회귀 위험 최소.

**트레이드오프:**
- "외부 의존성 최소" 원칙에서 벗어남(첫 서버 의존성). 그러나 인증·DB를 직접 구현하는 비용/위험이 훨씬 큼.
- 환경변수·Supabase 프로젝트 세팅이 배포 전제조건이 됨(README에 명시).

**나중에 재검토할 조건:**
- 트래픽/저장이 무료 티어를 넘어서면 요금제 또는 셀프호스트 검토.
- 공개 오픈 커뮤니티로 키우면 모더레이션·스팸·신고 기능 필요(현재 비범위).

---

## 2026-06-23 — 마크다운 렌더는 react-markdown

**상황:** TIL 본문이 마크다운. 렌더러 필요.

**옵션:** A. `react-markdown`(+`remark-gfm`)  B. 직접 정규식 파서(arXiv처럼)  C. `marked`+`dompurify`

**선택:** A.

**근거:** 마크다운은 arXiv Atom XML과 달리 **XSS 표면**(raw HTML, 링크)이라 직접 파싱은 위험. react-markdown은 기본적으로 raw HTML을 막아 안전하고, GFM(표·체크박스·취소선)을 remark-gfm로 커버. `@tailwindcss/typography` 없이 `components` prop으로 요소별 클래스만 지정해 의존성 추가 최소화.

**트레이드오프:** 번들 크기 증가(수용). 직접 파서 대비 통제력은 약간 줄지만 안전·표준 준수가 우선.

---

## 2026-06-03 — "나중에 읽기" 상태 모델

**상황:**
읽기 상태가 읽음/안읽음 이분법뿐이라, "피드에서 발견했지만 아직 안 읽은, 그러나 챙겨둘 논문"을 표시할 방법이 없다. Phase 4 첫 항목으로 "나중에 읽기 큐" 도입.

**옵션:**
- A. 기존 `read` Set 그대로 + 별도 `later` Set 추가 (두 Set 병행)
- B. `read` Set을 `{paperId: "later"|"read"}` status map으로 교체 (단일 모델, 마이그레이션 필요)

**선택:** A (두 Set 병행), 단 상호배타 정합성을 storage 레이어에서 강제.

**근거:**
- 기존 `getReadSet()`/`toggleRead()` API를 깨지 않아 호출처(PaperCard, notes, 상세 페이지) 수정 최소화.
- localStorage 마이그레이션 코드 불필요 (기존 `my-arxiv:read` 데이터 그대로 유효).
- 상호배타("한 논문은 unread/later/read 중 하나")는 토글 함수 안에서 강제: `read` 표시 시 `later`에서 제거, 그 역도 동일. 두 Set이 동시에 같은 id를 갖는 모순 상태를 만들지 않음.

**트레이드오프:**
- 모델링상 status map(B)이 더 정확하지만, 정합성을 함수로 강제하면 실질적 차이 없음.
- 두 Set을 다루는 곳에서 "양쪽 모두 확인"하는 코드가 약간 늘어남 (수용 가능).

**나중에 재검토할 조건:**
- 상태가 4개 이상으로 늘어나거나(예: "보관"·"중요"), 상태별 메타(추가 시각 등)가 필요해지면 status map(B)으로 리팩토링.
- SQLite 마이그레이션 시점에 자연스럽게 단일 테이블 컬럼으로 통합.

## 2026-06-04 — 노트 태그 (인라인 파싱 vs 별도 필드)

**상황:**
Phase 4 #2로 노트 태그 도입. 노트가 쌓일수록 `#RAG`·`#LongContext` 같은 주제로 묶어 보고 싶다. 입력·저장 방식을 정해야 함.

**옵션:**
- A. 노트 **본문 인라인** `#태그` 자동 파싱 — 본문에 `#RAG`라 쓰면 자동 인식. 별도 저장 필드·입력 UI 없음. 태그는 본문에서 매번 파생.
- B. **별도 태그 필드** — `NoteMap`에 `tags: string[]` 추가 + 전용 입력 UI. 본문과 분리.

**선택:** A (본문 인라인 파싱).

**근거:**
- vision의 "단순함" 원칙 — 별도 입력 UI·스키마 변경 없이 노트를 쓰면서 자연스럽게 태깅.
- localStorage 마이그레이션 불필요 (기존 `NoteMap{body,updatedAt}` 그대로, 태그는 `body`에서 파생).
- 파싱 규칙은 헤딩과 구분: `#` 앞이 줄 시작/공백 + `#` 뒤 즉시 단어문자(`[A-Za-z0-9가-힣_-]`). 따라서 마크다운 헤딩(`# 제목`, `## 제목` — `#` 뒤 공백/`#`)은 태그로 잡히지 않음.
- 대소문자: 표시는 첫 등장 원문 보존, 그룹·필터는 lowercase 키로 묶음 (`#RAG`=`#rag`).

**트레이드오프:**
- 태그 이름 변경/삭제 같은 "태그 관리" 기능이 어려움 (본문을 직접 고쳐야 함).
- 본문에 의도치 않은 `#단어`가 태그로 잡힐 수 있음 — 단, 노트는 짧은 메모라 위험 낮음.

**나중에 재검토할 조건:**
- 태그 rename/merge/삭제, 태그별 색상·설명 등 "태그를 1급 엔티티로" 다뤄야 하면 B(별도 필드 + 입력 UI)로 전환.
- SQLite 마이그레이션 시 태그를 별도 테이블로 정규화.

## 2026-06-05 — AI 요약 입력 확장 (본문 소스·파싱)

**상황:**
AI 요약 품질을 "요약만 봐도 논문 핵심 파악" 수준으로. 레버 1(abstract 기반 구조화)은 완료. 레버 2로 **논문 본문**을 입력에 넣어 더 깊은 요약을 만든다. 본문 소스·파싱 방식·폴백을 정해야 함.

**옵션:**
- 본문 소스 — A. `arxiv.org/html/{id}` (LaTeXML HTML) / B. `arxiv.org/pdf/{id}` (PDF)
- 파싱 — A. 정규식 텍스트 추출(외부 SDK 없음) / B. PDF 파서·HTML 파서 라이브러리 도입

**선택:** HTML(`arxiv.org/html/{id}`) + 정규식 추출. PDF·외부 파서 미사용.

**근거:**
- arxiv.org/html은 최근 논문 대부분 제공(LaTeXML 변환). 확인: 표본 3편 모두 200 + 산문 추출 양호(예: Mistral 7B 18.5k자).
- PDF 파싱은 무겁고 외부 라이브러리 필요 → vision의 "외부 SDK 최소화"와 충돌. HTML 정규식 추출은 기존 arXiv Atom 파서와 동일 철학.
- 추출 파이프라인: `<article>` 추출 → script/style·bibliography 제거 → `<math>`는 `alttext`(원본 LaTeX) 보존 후 제거 → 블록 태그를 줄바꿈으로 → 태그 제거 → 엔티티 디코드 → 길이 상한(45k자).
- **폴백 = graceful degradation**: HTML 없음(404)·추출 결과 과소(<500자)·네트워크 실패 시 abstract 요약(레버 1)으로 자동 폴백. 즉 레버 2는 레버 1의 상위 호환.
- 본문 fetch는 **서버(/api/summary)**에서 수행(본문이 커서 클라이언트 왕복은 비효율). 상세 페이지는 paper.id만 전달, 서버가 `extractArxivId`로 arXiv id 도출(HF 논문도 arXiv id면 본문 사용).
- 응답·캐시에 `mode`("fulltext"|"abstract") 기록 → UI에 "📄 본문 기반" 배지.

**트레이드오프:**
- 본문 입력으로 토큰·비용·응답시간↑ (thinking 포함 ~10s+). → 길이 상한 45k자 + localStorage 캐시(논문당 1회)로 완화.
- arxiv.org HTML은 모든 논문엔 없음 → 폴백으로 흡수(품질은 레버 1 수준).
- 무료 quota 입력 토큰 부담 — 1회성·캐시라 실사용 영향 미미. 문제 시 상한 하향.

**나중에 재검토할 조건:**
- HTML 미제공 논문 비중이 크면 PDF 파싱(별도 서비스/워커) 도입 검토.
- 토큰 비용이 문제되면 본문에서 핵심 섹션(intro/method/conclusion)만 선별 추출.

## 2026-06-18 — PWA 1차 (아이콘 생성·manifest 방식)

**상황:**
vision의 "PWA 설치 가능하게" 목표. 1차로 **홈 화면 설치 가능**까지(매니페스트 + 아이콘 + 메타). 오프라인 캐시(서비스워커)는 2차로 분리.

**옵션:**
- 아이콘 — A. `ImageResponse`(next/og)로 **코드 생성** / B. 정적 PNG를 외부 도구로 만들어 `public/`에 배치
- 매니페스트 — A. `app/manifest.ts`(Next 메타데이터 라우트) / B. 정적 `public/manifest.json`

**선택:** 아이콘=A(ImageResponse 코드 생성), 매니페스트=A(`app/manifest.ts`).

**근거:**
- 아이콘 PNG를 외부 도구(sharp·sips 등)로 만들면 새 의존성·바이너리 자산이 생김. `ImageResponse`는 Next 내장(next/og)이라 외부 SDK 0개로 192/512/apple 아이콘을 코드로 생성 → vision의 "외부 SDK 최소화" 준수, 색·이모지 변경도 코드로.
- `app/manifest.ts`는 Next 16 공식 메타데이터 라우트(타입 `MetadataRoute.Manifest`), 색상 토큰을 코드에서 참조해 일관성 유지.
- 색상: `theme_color #2563eb`(accent), `background_color #fafafa`(라이트 배경), `display: standalone`.
- 1차 구성: `app/icon.tsx`(512) · `app/apple-icon.tsx`(180) · `app/manifest.ts` · `layout.tsx`에 `viewport.themeColor`(Next 16은 themeColor가 metadata→viewport로 이동) + `appleWebApp`.

**트레이드오프:**
- `ImageResponse` 아이콘은 요청 시 렌더(런타임 비용) — 단 메타데이터 라우트라 빌드/캐시되어 실사용 영향 미미.
- manifest `icons.src`가 생성 아이콘 경로(`/icon`)를 가리키는데, Next 메타데이터 라우트 경로 동작은 브라우저 검증으로 확인(설치 가능성·아이콘 로드).

**나중에 재검토할 조건:**
- 2차: 서비스워커(오프라인 — 마지막 피드/노트 캐시). next 기본은 SW 미포함 → `next-pwa`류 도입 또는 수동 SW. 도입 시 의존성 ADR 재검토.
- 디자인 고도화(maskable 전용 아이콘, 스플래시) 필요 시 별도.
