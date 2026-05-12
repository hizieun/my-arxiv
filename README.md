# my-arxiv

관심있는 AI 분야의 신규 논문을 한 곳에서 탐색하고 관리하는 개인용 디스커버리 웹앱.

## 핵심 기능

### 📰 통합 피드 (`/`)
- arXiv(선택한 카테고리) + HuggingFace Daily Papers를 한 리스트로 머지
- 같은 논문이 두 소스에 있으면 자동 dedup (arXiv 우선, HF 인기 신호는 합쳐짐)
- 정렬: **최신순 / 🔥 인기순** 토글
- 기간 필터: 이번 주 / 최근 30일 / 전체

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

### 📝 노트 (`/notes`)
- 탭 필터: 노트 / 읽음 / 전체
- 키워드 검색 (제목·저자·본문)
- 읽음/노트 저장 시 논문 메타데이터 자동 캐싱 → 풍부한 목록 표시

### 🔥 인기도 신호
- HuggingFace Daily Papers의 `upvotes`를 popularity로 사용
- 카드 배지:
  - `📅 Daily` — HF Daily 큐레이션 선정
  - `🔥 N` (회색) — upvote 1~9
  - `🔥 N` (rose) — upvote 10+ (핫함)

### 💾 데이터 저장
- 모든 사용자 상태(카테고리/읽음/노트/메타)는 `localStorage`
- 서버 측 데이터 저장소 없음 — Vercel 배포해도 본인 브라우저에만 데이터가 쌓임

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
- **상태**: localStorage (v1) → 추후 SQLite 마이그레이션 예정

## 실행

```bash
npm install
npm run dev
# → http://localhost:3000
```

## 배포

Vercel 권장. `vercel.com/new`에서 GitHub repo 연결 → Deploy. 별도 설정 없음 (Next.js 자동 인식).

## 디렉토리

```
app/
  page.tsx                    # 피드
  search/page.tsx             # 검색
  categories/page.tsx         # 카테고리 설정
  notes/page.tsx              # 노트
  paper/[source]/[id]/page.tsx # 논문 상세
  api/
    feed/route.ts             # arXiv + HF 통합 피드
    search/route.ts           # 통합 검색
    paper/[source]/[id]/route.ts # 단건 lookup
components/
  NavBar.tsx
  PaperCard.tsx               # 인기/Daily 배지, 노트 토글
lib/
  arxiv.ts                    # arXiv 어댑터 (Atom XML 파서)
  huggingface.ts              # HF daily + search + 단건 어댑터
  aggregator.ts               # dedup + 인기 신호 머지
  categories.ts               # 카테고리 데이터
  storage.ts                  # localStorage 헬퍼
  types.ts                    # Paper, ArxivCategory 등
```

## 로드맵

### Phase 1 — MVP ✅
arXiv 피드, 카테고리, 읽음/노트 (localStorage)

### Phase 2 — 멀티 소스 + 검색 ✅
HuggingFace daily/search 어댑터, 통합 검색 페이지

### Phase 3 — 논문 상세 + 노트 강화 ✅
상세 페이지, 노트 검색·탭·자동 높이, 인기도 신호, Bio + Neuroscience 카테고리

### Phase 4 — 후보
- Claude API 한국어 요약 (abstract → 3-bullet)
- "나중에 읽기" 큐 (읽음/안읽음 이분법 해소)
- 노트 태그 (`#RAG`, `#LongContext`) + 콜렉션
- 키보드 단축키 (`j/k`, `r`, `n`, `Cmd+K`)
- SQLite + 로그인 → 멀티 디바이스 동기화
- PDF 인라인 뷰어
- 저자/연구실 팔로우 + 노티
- Semantic Scholar 통합 (관련 논문, 인용 그래프)

## 참고: 데이터 소스

- arXiv 카테고리 분류: https://arxiv.org/category_taxonomy
- HuggingFace Papers: https://huggingface.co/papers
- Papers with Code의 API는 HuggingFace로 통합되며 deprecated됨 (v0.2부터 미사용)
