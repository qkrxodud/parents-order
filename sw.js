// 단골집 주문 서비스워커
// 앱 셸을 캐시해 홈 화면 앱이 오프라인/느린 네트워크에서도 빠르게 열리도록 한다.
const CACHE = 'dangol-order-v1';

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

// 같은 출처 GET 요청만 캐시 우선으로 응답, 그 외(파이어베이스 등)는 네트워크 그대로
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // 정상 응답이면 백그라운드로 캐시에 보관
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
