// my-arxiv 수동 서비스워커 (PWA 오프라인 2차)
// 전략:
//  - 정적 자산: cache-first (해시 파일이라 안전)
//  - 페이지 네비게이션 + GET /api/*: network-first → 오프라인 시 캐시 폴백
//  - /auth/*, 외부(arXiv·HF·Supabase·Gemini), 비-GET: 패스스루(캐시 안 함)
// 캐시 무효화: CACHE_VERSION 을 올리면 activate에서 옛 캐시를 정리한다.

const CACHE_VERSION = "v3";
const STATIC_CACHE = `my-arxiv-static-${CACHE_VERSION}`;
const PAGE_CACHE = `my-arxiv-pages-${CACHE_VERSION}`;
const API_CACHE = `my-arxiv-api-${CACHE_VERSION}`;
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, PAGE_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/apple-icon") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/.test(url.pathname)
  );
}

// network-first: 네트워크 성공 시 캐시에 저장 후 반환, 실패 시 캐시(없으면 fallback) 반환
async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (fallbackUrl) {
      const fb = await cache.match(fallbackUrl);
      if (fb) return fb;
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부 도메인 패스스루
  if (url.pathname.startsWith("/auth/")) return; // 인증 흐름은 항상 네트워크

  // 정적 자산: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // GET API: network-first (+오프라인 시 마지막 응답 캐시 폴백)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req, API_CACHE));
    return;
  }

  // Next.js RSC prefetch/네비게이션 요청(?_rsc 또는 RSC 헤더): network-first 캐시
  // → 온라인에서 본 페이지를 오프라인에서도 열 수 있고, prefetch 실패 노이즈도 감소
  if (url.searchParams.has("_rsc") || req.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(req, PAGE_CACHE));
    return;
  }

  // 페이지 네비게이션: network-first (+캐시·홈 폴백)
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, PAGE_CACHE, OFFLINE_URL));
  }
});
