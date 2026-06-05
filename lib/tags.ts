// 노트 본문 인라인 #태그 파서.
// 규칙: '#' 앞이 줄 시작 또는 공백, '#' 뒤 즉시 단어문자(영문/숫자/한글/_/-).
// → 마크다운 헤딩('# 제목', '## 제목' = '#' 뒤 공백/'#')은 태그로 잡지 않음.
const TAG_RE = /(?:^|\s)#([A-Za-z0-9가-힣_-]+)/g;

export interface TagCount {
  tag: string; // 표시용 — 첫 등장 원문 표기 보존
  key: string; // 비교/그룹용 — lowercase
  count: number;
}

// 한 노트 본문에서 태그 추출 (표시 표기 보존, key 기준 중복 제거).
export function extractTags(body: string): string[] {
  if (!body) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of body.matchAll(TAG_RE)) {
    const tag = m[1];
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out;
}

// 노트가 특정 태그(key 기준)를 포함하는지.
export function noteHasTag(body: string, tagKey: string): boolean {
  const key = tagKey.toLowerCase();
  return extractTags(body).some((t) => t.toLowerCase() === key);
}

// 여러 노트 본문에서 태그를 집계 (빈도 내림차순, 동률은 이름 오름차순).
// 같은 key의 표시 표기는 첫 등장(정렬 전 순회 기준)을 보존.
export function aggregateTags(bodies: string[]): TagCount[] {
  const map = new Map<string, TagCount>();
  for (const body of bodies) {
    for (const tag of extractTags(body)) {
      const key = tag.toLowerCase();
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { tag, key, count: 1 });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.key.localeCompare(b.key),
  );
}
