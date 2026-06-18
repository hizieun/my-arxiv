import type { Paper } from "./types";

const ARXIV_API = "https://export.arxiv.org/api/query";
// arXiv는 식별 가능한 User-Agent(연락처/출처 포함)를 권장.
const USER_AGENT = "my-arxiv/0.4 (+https://github.com/hizieun/my-arxiv)";

// arXiv는 버스트 호출에 429("Rate exceeded")를 반환. 순간적 rate limit이
// 대부분이므로 429/5xx에 한해 지수 백오프로 짧게 재시도한다.
// 또한 차단 시 arXiv가 응답을 매우 느리게(15s+) 주는 경우가 있어, 각 시도에
// AbortController 타임아웃을 걸어 느린 응답을 빨리 끊고 다음 시도로 넘어간다.
// (정상 응답은 1s 미만이라 타임아웃의 영향을 받지 않음)
const ATTEMPT_TIMEOUT_MS = 6000;

async function arxivFetch(url: string, revalidate: number): Promise<Response> {
  const maxAttempts = 3;
  let res: Response | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate },
        signal: controller.signal,
      });
    } catch (err) {
      // 타임아웃(abort) 또는 네트워크 오류 → 마지막 시도면 throw, 아니면 재시도
      if (attempt === maxAttempts - 1) throw err;
      continue;
    } finally {
      clearTimeout(timer);
    }
    if (res.ok) return res;
    // 클라이언트 오류(429 제외)는 재시도 의미 없음 → 즉시 반환
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt < maxAttempts - 1) {
      const backoffMs = 500 * 2 ** attempt; // 500 → 1000
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  // 모든 시도가 429/5xx로 끝난 경우 마지막 응답 반환 (호출부에서 !ok 처리)
  if (!res) throw new Error("arXiv API: no response");
  return res;
}

interface FetchOptions {
  categories?: string[];
  query?: string;
  start?: number;
  maxResults?: number;
  sortBy?: "submittedDate" | "lastUpdatedDate" | "relevance";
  sortOrder?: "ascending" | "descending";
}

function buildSearchQuery({ categories, query }: FetchOptions): string {
  const parts: string[] = [];
  if (categories?.length) {
    const cats = categories.map((c) => `cat:${c}`).join("+OR+");
    parts.push(`(${cats})`);
  }
  if (query) {
    const escaped = encodeURIComponent(query).replace(/%20/g, "+");
    parts.push(`(ti:${escaped}+OR+abs:${escaped})`);
  }
  return parts.join("+AND+") || "cat:cs.AI";
}

export async function fetchArxivById(arxivId: string): Promise<Paper | null> {
  // arXiv id_list는 버전 suffix(v1, v2…)를 붙이면 결과가 0건이 됨 → 떼고 최신 버전 조회
  const bareId = arxivId.replace(/v\d+$/, "");
  const url = `${ARXIV_API}?id_list=${encodeURIComponent(bareId)}`;
  const res = await arxivFetch(url, 3600);
  if (!res.ok) return null;
  const xml = await res.text();
  return parseAtom(xml)[0] ?? null;
}

const FULLTEXT_MAX_CHARS = 28000; // 입력 토큰·응답시간 통제 (intro/method/results 충분)
const FULLTEXT_MIN_CHARS = 500;

// arxiv.org/html/{id} (LaTeXML HTML)에서 본문 텍스트를 추출.
// HTML 미제공·추출 과소·실패 시 null → 호출부는 abstract 요약으로 폴백.
export async function fetchArxivFulltext(arxivId: string): Promise<string | null> {
  const bareId = arxivId.replace(/v\d+$/, "");
  const url = `https://arxiv.org/html/${encodeURIComponent(bareId)}`;
  let res: Response;
  try {
    res = await arxivFetch(url, 86400); // 본문은 잘 안 바뀜 → 하루 캐시
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const text = extractFulltext(await res.text());
  return text.length >= FULLTEXT_MIN_CHARS ? text : null;
}

function extractFulltext(html: string): string {
  // 1. <article> 본문만 (없으면 전체)
  const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  let s = art ? art[1] : html;
  // 2. script/style 제거
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  // 3. 참고문헌 섹션부터 끝까지 제거 (요약에 불필요, 토큰 낭비)
  s = s.replace(/<section[^>]*ltx_bibliography[\s\S]*$/i, "");
  // 4. 수식: alttext(원본 LaTeX) 보존 후 math 태그 제거
  s = s.replace(/<math[^>]*\salttext="([^"]*)"[^>]*>[\s\S]*?<\/math>/gi, " $1 ");
  s = s.replace(/<math[^>]*>[\s\S]*?<\/math>/gi, " ");
  // 5. 블록 종료 태그 → 줄바꿈
  s = s.replace(/<\/(p|h[1-6]|section|li|div|figcaption|tr)>/gi, "\n");
  // 6. 나머지 태그 제거
  s = s.replace(/<[^>]+>/g, "");
  // 7. HTML 엔티티 디코드
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
  // 8. 공백 정규화 + 길이 상한
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return s.length > FULLTEXT_MAX_CHARS ? s.slice(0, FULLTEXT_MAX_CHARS) : s;
}

export async function fetchArxivPapers(opts: FetchOptions): Promise<Paper[]> {
  const search = buildSearchQuery(opts);
  const params = new URLSearchParams({
    search_query: search,
    start: String(opts.start ?? 0),
    max_results: String(opts.maxResults ?? 30),
    sortBy: opts.sortBy ?? "submittedDate",
    sortOrder: opts.sortOrder ?? "descending",
  });
  const url = `${ARXIV_API}?${params.toString().replace(/%2B/g, "+")}`;

  const res = await arxivFetch(url, 1800);
  if (!res.ok) throw new Error(`arXiv API ${res.status}`);
  const xml = await res.text();
  return parseAtom(xml);
}

function parseAtom(xml: string): Paper[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries.map((entry) => {
    const id = pick(entry, "id") ?? "";
    const title = clean(pick(entry, "title") ?? "");
    const summary = clean(pick(entry, "summary") ?? "");
    const published = pick(entry, "published") ?? "";
    const updated = pick(entry, "updated") ?? "";
    const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)].map(
      (m) => clean(m[1]),
    );
    const categories = [...entry.matchAll(/<category[^>]*term="([^"]+)"/g)].map((m) => m[1]);
    const pdfLink = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/)?.[1];
    const arxivId = id.replace(/^https?:\/\/arxiv\.org\/abs\//, "");
    return {
      id: `arxiv:${arxivId}`,
      source: "arxiv" as const,
      title,
      authors,
      abstract: summary,
      publishedAt: published,
      updatedAt: updated || undefined,
      categories,
      pdfUrl: pdfLink,
      htmlUrl: id,
    } satisfies Paper;
  });
}

function pick(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : null;
}

function clean(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
