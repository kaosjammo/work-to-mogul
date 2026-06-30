// Minimal hand-rolled service worker (no build plugin) for installability +
// offline play. Strategy:
//   - navigations (HTML): network-first (pick up new asset references)
//   - /assets/** (unhashed art): stale-while-revalidate (serve cached fast,
//     refresh in background so edited icons update on the next load)
//   - other assets (hashed JS/CSS, immutable): cache-first
// Bump CACHE whenever cached files change at a stable path (e.g. edited art).
const CACHE = 'tycoon-empire-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    // Network-first; fall back to cached shell when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/index.html'))),
    )
    return
  }

  // Art lives at stable, unhashed /assets/ paths — stale-while-revalidate so an
  // edited icon refreshes on the next visit instead of being pinned forever.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res.ok && res.type === 'basic') cache.put(req, res.clone())
              return res
            })
            .catch(() => cached)
          return cached || network
        }),
      ),
    )
    return
  }

  // Cache-first for hashed assets (immutable).
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
