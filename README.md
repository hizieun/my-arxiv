# my-arxiv

관심있는 AI 분야의 신규 논문을 한 곳에서 탐색·관리하고, **각자 공부한 내용(TIL/학습 글)을 올려 공유하는 커뮤니티** 웹앱.

> 논문 탐색·노트·AI 요약은 **로그인 없이** 브라우저에서 완결되고(localStorage), 커뮤니티 글쓰기만 **로그인**(Supabase)이 필요합니다.

## 핵심 기능

### 📰 통합 피드 (`/`)
- arXiv(선택한 카테고리) + HuggingFace Daily Papers를 한 리스트로 머지
- 같은 논문이 두 소스에 있으면 자동 dedup (arXiv 우선, HF 인기 신호는 합쳐짐)
- **점진적 로딩** — arXiv·HF를 분리 호출해 먼저 도착하는 쪽부터 렌더 (arXiv가 느려도 HF 먼저 표시)
- **sessionStorage 캐시** — 같은 카테고리 재방문 시 캐시에서 즉시 표시 후 백그라운드 갱신
- 정렬: **최신순 / 🔥 인기순** 토글
- 기간 필터: 이번 주 / 최근 30일 / 전체
- **키보드 단축키** — `j`/`k` 카드 이동, `Enter`/`o` 상세 열기

### 🏷️ 카테고리 설정 (`/categories`)
- arXiv 카테고리를 그룹으로 묶어 토글 (`Core AI`, `Applications`, `Statistics`, **`Bio + Neuroscience`**)
- 선택 즉시 피드에 반영, localStorage에 영속

### 🔍 통합 검색 (`/search`)
- arXiv + HuggingFace 키워드 검색
- 소스 필터 칩 (전체 / arXiv / HF)
- 결과 카운트: `결과 N건 (arXiv X / HF Y)`

### 📄 논문 상세 (`/paper/[source]/[id]`)
- abstract 전문 + 메타데이터 + 큰 노트 에디터
- `Cmd/Ctrl+S` 저장, 마지막 저장 시각 표시
- **🤖 AI 한국어 요약** (아래 참고)
- 읽음 / 🔖 나중에 토글

### 🤖 AI 한국어 요약
- 상세 페이지에서 "한국어 요약 보기" → **구조화 심층 요약** (요약만 봐도 논문 핵심 파악)
  - 📌 한 줄 요약 / 🎯 풀려는 문제 / 🔧 핵심 접근 / 📊 핵심 결과(수치 포함) / 💡 의의
  - 전문 용어는 괄호로 풀이, 본문/abstract에 없는 사실은 지어내지 않도록 가드
- **본문 기반 요약** — `arxiv.org/html`에서 논문 전문을 가져와 방법·실험 디테일까지 반영 (📄 본문 기반 배지)
  - 본문 HTML이 없는 논문은 abstract 기반 요약으로 자동 폴백 (graceful degradation)
- 모델: **Google Gemini 2.5 Flash** (`@google/genai`, 동적 thinking 활성, 503 재시도)
- 생성 결과는 `localStorage`에 캐싱 → 같은 논문 재방문 시 **API 재호출 없이 즉시 표시**
- "💾 캐시됨 · 날짜시각" 메타 + "↺ 재생성" 버튼
- `GOOGLE_API_KEY` 환경변수 필요 (아래 [실행](#실행) 참고)

### 💬 논문 Q&A
- 논문 상세에서 본문(또는 abstract) 근거로 **자유 질문** → Gemini 한국어 답변
- 요약과 같은 인프라 재활용 (`arxiv.org/html` 본문 → 없으면 abstract 폴백, 📄 본문 기반 배지)
- 논문에 없는 내용은 지어내지 않도록 프롬프트 가드. 세션 단위 Q&A 히스토리

### 📝 노트 & 읽기 상태 (`/notes`)
- 읽기 상태 3단계: **안읽음 / 🔖 나중에 / ✓ 읽음** (상호배타)
- 탭 필터: 노트 / 🔖 나중에 / 읽음 / 전체
- 키워드 검색 (제목·저자·본문)
- **노트 태그** — 노트 본문에 `#RAG` `#LongContext`처럼 쓰면 자동 인식. 태그 칩으로 필터(빈도순, 대소문자 무시). 마크다운 헤딩(`# 제목`)과는 구분됨
- 읽음·나중에·노트 저장 시 논문 메타데이터 자동 캐싱 → 풍부한 목록 표시

### 📓 커뮤니티 (`/community`)
- 각자 공부한 내용을 **마크다운 학습 글(TIL)** 로 작성·공유 (논문에 묶이지 않는 독립 글)
- 목록(최신순) / 상세(마크다운 렌더, GFM 표·코드블록) / 작성·수정·삭제
- **태그** — 글에 태그를 달아 `?tag=` 로 필터
- 작성 시 **미리보기 토글**(편집 ↔ 마크다운 렌더)
- **💬 댓글** — 글마다 댓글 (로그인 작성, 본인 댓글만 삭제)
- **♥ 좋아요** — 글 목록·상세·프로필에서 토글 (1인 1좋아요), 🔥 인기순 정렬
- **🖼 이미지 업로드** — 글 작성 시 스크린샷·다이어그램을 Supabase Storage에 올려 본문에 삽입
- **👤 프로필** (`/u/[username]`) — 작성자명 클릭 시 그 사람의 글 모아보기
- **논문 → 글쓰기** — 논문 상세의 "✍️ 이 논문으로 학습 글 쓰기"로 제목·본문(논문 링크)·태그 프리필
- **GitHub OAuth 로그인** (Supabase Auth). 비로그인은 읽기만, 작성·수정·삭제·좋아요는 로그인 필요
- 권한은 **RLS(Row Level Security)** 로 DB에서 강제 — 누구나 읽기, **본인 것만** 수정·삭제

### 🔥 인기도 신호
- HuggingFace Daily Papers의 `upvotes`를 popularity로 사용
- 카드 배지:
  - `📅 Daily` — HF Daily 큐레이션 선정
  - `🔥 N` (회색) — upvote 1~9
  - `🔥 N` (rose) — upvote 10+ (핫함)

### 💾 데이터 저장
- **개인 상태 = 브라우저 스토리지** (논문 탐색은 서버 불필요, 본인 브라우저에만 쌓임)
  - `localStorage` — 카테고리 / 읽음 / 나중에 / 노트 / 메타 / 요약 캐시
  - `sessionStorage` — 피드 캐시 (탭 단위)
- **커뮤니티 = Supabase(Postgres)** — 학습 글·프로필은 서버 DB에 저장, RLS로 권한 강제

## 카테고리 (현재 지원)

| 그룹 | 코드 | 분야 |
|---|---|---|
| Core AI | cs.AI, cs.LG, cs.CL, cs.CV, cs.NE, cs.MA | AI · ML · NLP · CV · NN · 멀티에이전트 |
| Applications | cs.RO, cs.IR, cs.HC, cs.CR | 로보틱스 · IR · HCI · 보안 |
| Statistics | stat.ML, stat.AP | 통계 ML · 응용 통계 |
| Bio + Neuroscience | q-bio.NC, q-bio.QM, q-bio.BM, q-bio.GN, q-bio.MN, q-bio.CB | 뇌과학 · 정량생물학 · 생체분자 · 유전체 · 분자네트워크 · 세포행동 |

## 기술 스택

- **Frontend/Backend**: Next.js 16 (App Router) · React 19 · TypeScript
- **Style**: Tailwind CSS v4
- **데이터 소스**:
  - arXiv Atom XML API (외부 XML 파서 없이 정규식 파싱)
  - HuggingFace `daily_papers` + `papers/search` API
- **AI 요약**: Google Gemini 2.5 Flash (`@google/genai`)
- **커뮤니티**: Supabase (Postgres + Auth, `@supabase/ssr`) · GitHub OAuth · RLS
- **마크다운**: `react-markdown` + `remark-gfm`
- **상태**: 개인용은 localStorage / sessionStorage, 커뮤니티는 Supabase Postgres

## 실행

```bash
npm install

# .env.local 에 키 추가 (아래 항목 참고)
npm run dev
# → http://localhost:3000
```

### 환경변수 (`.env.local`)

```bash
# AI 요약 (없어도 논문 탐색·노트는 동작)
GOOGLE_API_KEY=발급받은_키

# 커뮤니티 (없으면 /community 가 "불러오지 못했어요"로 표시, 나머지 기능은 정상)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

### 커뮤니티(Supabase) 1회 세팅

1. [supabase.com](https://supabase.com)에서 프로젝트 생성 → **Project URL**, **anon public key** 확보 (위 환경변수).
2. Supabase **SQL Editor**에 [`supabase/schema.sql`](./supabase/schema.sql) 실행 (테이블·RLS·트리거). 이미지 업로드까지 쓰려면 [`supabase/storage.sql`](./supabase/storage.sql)도 실행 (Storage 버킷·정책).
3. **GitHub OAuth** 설정:
   - GitHub → Settings → Developer settings → **OAuth Apps**에서 앱 생성. Authorization callback URL: `https://<project>.supabase.co/auth/v1/callback`
   - 발급된 Client ID/Secret을 Supabase **Authentication → Providers → GitHub**에 입력·활성화.
   - *대안: OAuth 앱이 번거로우면 매직링크(이메일 OTP)로 `app/login/page.tsx`를 스왑 가능.*
4. `npm run dev` → `/login`에서 로그인 → `/community`에서 글 작성.

`GOOGLE_API_KEY`는 [Google AI Studio](https://aistudio.google.com/apikey)에서 무료로 발급.
> ⚠️ 일부 계정에서 `gemini-2.0-flash`는 무료 티어 quota가 `limit: 0`으로 잡힘 →
> 본 프로젝트는 `gemini-2.5-flash`를 사용해 우회. (자세한 내용: `docs/learnings.md`)

기타 명령어:

```bash
npm run build     # 프로덕션 빌드
npm run start     # 빌드 서빙
npm run lint      # ESLint
npx tsc --noEmit  # 타입 체크
```

## 배포

Vercel 권장. `vercel.com/new`에서 GitHub repo 연결 → Deploy.
Vercel 프로젝트 **Settings → Environment Variables**에 `GOOGLE_API_KEY`(AI 요약), `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`(커뮤니티) 추가.
> 배포 도메인을 GitHub OAuth App의 callback/홈 URL과 Supabase Auth **Redirect URLs**에도 등록해야 로그인이 동작합니다.

## 디렉토리

```
proxy.ts                       # Next 16 Proxy(구 미들웨어) — Supabase 세션 갱신
supabase/
  schema.sql                   # 커뮤니티 DB 스키마 + RLS + 트리거 (SQL Editor에 실행)
app/
  page.tsx                     # 피드 (점진적 로딩 + 캐시)
  search/page.tsx              # 검색
  categories/page.tsx          # 카테고리 설정
  notes/page.tsx               # 노트 / 나중에 / 읽음
  paper/[source]/[id]/page.tsx # 논문 상세 + AI 요약
  login/page.tsx               # GitHub OAuth 로그인
  auth/callback/route.ts       # OAuth 코드 → 세션 교환
  community/
    page.tsx                   # 학습 글 목록 (+ ?tag= 필터)
    new/page.tsx               # 글 작성 (로그인 필수)
    [id]/page.tsx              # 글 상세 (마크다운 렌더)
    [id]/edit/page.tsx         # 글 수정 (본인만)
    actions.ts                 # 서버 액션 create/update/delete
  api/
    feed/route.ts              # arXiv + HF 통합 피드 (?source=arxiv|hf 분리 호출)
    search/route.ts            # 통합 검색
    paper/[source]/[id]/route.ts # 단건 lookup
    summary/route.ts           # Gemini 한국어 요약
components/
  NavBar.tsx                   # 네비 + 인증 상태(@username/로그아웃)
  PaperCard.tsx                # 인기/Daily 배지, 읽음/나중에/노트 토글
  Markdown.tsx                 # react-markdown + remark-gfm 렌더
  PostForm.tsx                 # 글 작성/수정 폼 (미리보기 토글)
lib/
  arxiv.ts                     # arXiv 어댑터 (Atom XML 파서)
  huggingface.ts               # HF daily + search + 단건 어댑터
  aggregator.ts                # dedup + 인기 신호 머지
  gemini.ts                    # Gemini 요약 어댑터
  tags.ts                      # 노트 #태그 파서 (인라인 추출 + 집계)
  categories.ts                # 카테고리 데이터
  storage.ts                   # localStorage/sessionStorage 헬퍼 + useSyncExternalStore 훅
  supabase/                    # client/server/middleware(=proxy 헬퍼)
  types.ts                     # Paper, Post, Profile, ArxivCategory 등
```

## 로드맵

### Phase 1 — MVP ✅
arXiv 피드, 카테고리, 읽음/노트 (localStorage)

### Phase 2 — 멀티 소스 + 검색 ✅
HuggingFace daily/search 어댑터, 통합 검색 페이지

### Phase 3 — 논문 상세 + 노트 강화 ✅
상세 페이지, 노트 검색·탭·자동 높이, 인기도 신호, Bio + Neuroscience 카테고리

### Phase 4 — 진행 중
- ✅ AI 한국어 요약 (Gemini 2.5 Flash, 본문 기반 구조화 심층 요약 + 캐시)
- ✅ "나중에 읽기" 큐 (읽음/안읽음 이분법 해소 → 3단계)
- ✅ 피드 점진적 로딩 + sessionStorage 캐시
- ✅ 노트 태그 (`#RAG`, `#LongContext` 본문 인라인 파싱 + 필터)
- ⬜ 키보드 단축키 (`j/k`, `r`, `n`, `Cmd+K`)
- 🔶 PWA — 1차 설치 가능(manifest + 코드 생성 아이콘 + standalone) ✅ / 오프라인 캐시(서비스워커) 2차 ⬜

### Phase 5 — 커뮤니티 ✅
학습 글(TIL) 공유 — Supabase(Postgres+Auth+RLS), GitHub OAuth, 글 CRUD + 태그, 마크다운 렌더.
후속 완료: 💬 댓글 / ♥ 좋아요·인기순 / 👤 프로필(`/u/[username]`) / 논문→글쓰기 / 🖼 이미지 업로드.

### Phase 6 — AI·UX 강화 ✅(일부)
- ✅ 논문 Q&A (본문/abstract 기반 자유 질문, Gemini)
- ✅ 피드 키보드 단축키 (j/k, Enter)
- ⬜ PWA 오프라인 2차 (서비스워커) — 의존성 결정(ADR) 선행, 보류 중

### Phase 7+ — 후보
- 키워드 기반 매일 아침 자동 큐레이션 (에이전트)
- SQLite + 로그인 → 멀티 디바이스 동기화
- PDF 인라인 뷰어
- 저자/연구실 팔로우 + 노티
- Semantic Scholar 통합 (관련 논문, 인용 그래프)
- 영어 UI (i18n)

## 참고: 데이터 소스

- arXiv 카테고리 분류: https://arxiv.org/category_taxonomy
- HuggingFace Papers: https://huggingface.co/papers
- Papers with Code의 API는 HuggingFace로 통합되며 deprecated됨 (v0.2부터 미사용)
