# my-arxiv

관심있는 AI 분야의 신규 논문을 한 곳에서 탐색하고 관리하는 개인용 디스커버리 웹앱.

## 기능 (Phase 1 MVP)

- **주별 신규 피드** — 관심 카테고리(cs.AI · cs.LG · cs.CL 등)의 신규 arXiv 논문을 카드 리스트로
- **카테고리 설정** — Core AI / Applications / Statistics 그룹에서 토글로 관심 분야 선택
- **읽음 표시** — 카드 단위 읽음/안읽음 토글, 읽은 논문은 흐리게
- **노트** — 논문별 마크다운 메모, `/notes` 페이지에서 모아보기

선택/읽음/노트 상태는 모두 `localStorage`에 저장 (Phase 2에서 DB로 이전 예정).

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- arXiv Atom XML API (외부 파서 의존 없음)

## 실행

```bash
npm install
npm run dev
# → http://localhost:3000
```

## 로드맵

- **Phase 2** — HuggingFace daily_papers + Papers with Code 어댑터, 검색 페이지
- **Phase 3** — 논문 상세 페이지, 노트 검색
- **Phase 4** — SQLite + 로그인, Claude API 한국어 요약, 임베딩 기반 추천

## 디렉토리

```
app/         # 페이지 + API routes
components/  # NavBar, PaperCard
lib/         # arxiv 어댑터, 카테고리 데이터, storage 헬퍼, 타입
```
