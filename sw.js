// 단골집 주문 서비스워커
// 앱 셸을 캐시해 홈 화면 앱이 오프라인/느린 네트워크에서도 빠르게 열리도록 한다.
// 버전을 올리면 이전 캐시를 비우고 새 셸을 다시 받는다. (배포 시 버전 갱신)
const CACHE = 'dangol-order-v2';

// 캐시할 앱 셸 (서비스워커 위치 기준 상대 경로)
const SHELL = [
  './',
  './index.html',
  './vendor/firebase/firebase-app.js',
  './vendor/firebase/firebase-auth.js',
  './vendor/firebase/firebase-database.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

// 설치 시 앱 셸 미리 캐시 (개별 실패는 무시해 설치가 막히지 않게 한다)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

// 활성화 시 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 같은 출처 GET만 처리. HTML(문서)은 네트워크 우선, 나머지 정적 자원은 캐시 우선.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML 문서는 항상 최신을 받도록 네트워크 우선 (업데이트가 바로 반영됨)
  const isHtml = request.mode === 'navigate' || request.destination === 'document';
  if (isHtml) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 아이콘·SDK 등 정적 자원은 캐시 우선 (빠른 실행)
  event.respondWith(cacheFirst(request));
});

// 네트워크 우선: 성공하면 최신 응답을 캐시에 갱신, 실패(오프라인)하면 캐시로 폴백
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')));
}

// 캐시 우선: 캐시에 있으면 즉시 반환, 없으면 네트워크에서 받아 캐시에 보관
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    });
  });
}
