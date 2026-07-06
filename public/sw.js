const CACHE = 'resume-v8';
const APP_SHELL = [
  '/',
  '/en/',
  '/resume-onepage',
  '/en/resume-onepage',
  '/resume-academic',
  '/en/resume-academic',
  '/resume-career',
  '/en/resume-career',
  '/modeling',
  '/en/modeling',
  '/ai-km',
  '/en/ai-km',
  '/evidence',
  '/en/evidence',
  '/materials',
  '/en/materials',
  '/chem-ai-lab',
  '/en/chem-ai-lab',
  '/styles/site.css',
  '/manifest.json',
  '/blog/',
  '/en/blog/',
  '/silicon-ashes/',
  '/en/silicon-ashes/',
  '/silicon-ashes/writing/',
  '/en/silicon-ashes/writing/',
  '/silicon-ashes/courses/',
  '/en/silicon-ashes/courses/',
  '/silicon-ashes/resources/',
  '/en/silicon-ashes/resources/',
  '/silicon-ashes/about/',
  '/en/silicon-ashes/about/',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
