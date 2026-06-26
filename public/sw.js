// my-arxiv 수동 서비스워커 (PWA 오프라인 2차)
// 전략: 정적 자산 cache-first / 페이지 네비게이션 network-first(+캐시 폴백).
// 동적·인증 요청(arXiv·HF·Supabase·Gemini, /api/*)은 캐시하지 않음.
// 캐시 무효화: CACHE_VERSION 을 올리면 activate에서 옛 캐시를 정리한다.

const CACHE_VERSION = "v1";
const STATIC_CACHE = `my-arxiv-static-${CACHE_VERSION}`;
const PAGE_CACHE = `my-arxiv-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  // 앱 셸 진입점(홈)을 미리 받아 오프라인 폴백으로 사용
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, PAGE_CACHE]);
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
    /\.(?:css|js|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 동일 출처만 처리 (arXiv·HF·Supabase·Gemini 등 외부는 패스스루)
  if (url.origin !== self.location.origin) return;

  // 동적/인증 경로는 항상 네트워크 (캐시 금지)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // 정적 자산: cache-first (해시 파일이라 안전)
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

  // 페이지 네비게이션: network-first → 실패 시 캐시 → 홈 폴백
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          const cache = await caches.open(PAGE_CACHE);
          return (await cache.match(req)) || (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
  }
});
