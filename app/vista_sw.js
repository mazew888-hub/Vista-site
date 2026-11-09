// Vista's offline copy: opens instantly from what's stored on the phone,
// then quietly fetches any newer version for next time. Only Vista's own
// files; Google Drive, pictures and videos from other sites pass through.
const CACHE = 'vista-app-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  // Every way of opening the app (with ?query or #sign-in hash) is one page.
  const key = req.mode === 'navigate' ? new Request(self.registration.scope) : req;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const fresh = fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
        return res;
      })
      .catch(() => hit);
    if (hit) {
      event.waitUntil(fresh.then(() => undefined, () => undefined));
      return hit;
    }
    return fresh;
  })());
});
