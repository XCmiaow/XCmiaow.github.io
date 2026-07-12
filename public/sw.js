const CACHE = 'resume-v12';
const ROUTE_CONTRACT = '/route-contract.json';
const CACHEABLE_PREFIXES = ['/assets/', '/styles/', '/silicon-ashes/courses/ai-research-efficiency/'];
const BYPASS_PREFIXES = ['/admin/', '/write/'];
let appShellPromise;

async function parseRouteContract(response) {
  if (!response.ok) throw new Error(`Route contract request failed: ${response.status}`);
  const payload = await response.json();
  if (
    payload?.version !== 1 ||
    !Array.isArray(payload.appShell) ||
    payload.appShell.some((route) => typeof route !== 'string' || !route.startsWith('/'))
  ) {
    throw new Error('Route contract payload is invalid');
  }
  return payload.appShell;
}

function getAppShell() {
  if (!appShellPromise) {
    appShellPromise = caches
      .match(ROUTE_CONTRACT)
      .then((cached) => cached || fetch(ROUTE_CONTRACT, { cache: 'no-store' }))
      .then(parseRouteContract);
  }
  return appShellPromise;
}

function isBypassed(url) {
  return BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function isCacheable(request, url) {
  if (request.method !== 'GET') return false;
  if (url.origin !== location.origin) return false;
  if (url.search) return false;
  if (isBypassed(url)) return false;
  if ((await getAppShell()).includes(url.pathname)) return true;
  return CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    fetch(ROUTE_CONTRACT, { cache: 'no-store' })
      .then(parseRouteContract)
      .then((appShell) => {
        appShellPromise = Promise.resolve(appShell);
        return caches.open(CACHE).then((cache) => cache.addAll(appShell));
      }),
  );
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
  e.respondWith(handleFetch(e.request, url));
});

async function handleFetch(request, url) {
  const cacheable = await isCacheable(request, url);

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return fetch(request)
      .then((res) => {
        if (cacheable && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')));
  }

  if (!cacheable) {
    return fetch(request);
  }

  return caches.match(request).then((cached) => {
    const fetched = fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => cached);
    return cached || fetched;
  });
}
