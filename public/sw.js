/* Service worker minimale: l'app funziona anche offline dopo la prima visita. */
const CACHE = 'livelli-v1'
const BASE = new URL('./', self.location).pathname

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([BASE, `${BASE}index.html`, `${BASE}manifest.webmanifest`]))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const richiesta = event.request
  if (richiesta.method !== 'GET') return
  const url = new URL(richiesta.url)
  if (url.origin !== self.location.origin) return

  // Navigazioni: prima la rete (per avere gli aggiornamenti), poi la cache.
  if (richiesta.mode === 'navigate') {
    event.respondWith(
      fetch(richiesta)
        .then((risposta) => {
          const copia = risposta.clone()
          caches.open(CACHE).then((c) => c.put(`${BASE}index.html`, copia))
          return risposta
        })
        .catch(() => caches.match(`${BASE}index.html`).then((r) => r || caches.match(BASE))),
    )
    return
  }

  // Asset statici: prima la cache, aggiornamento in background.
  event.respondWith(
    caches.match(richiesta).then((cache) => {
      const rete = fetch(richiesta)
        .then((risposta) => {
          if (risposta && risposta.status === 200 && risposta.type === 'basic') {
            const copia = risposta.clone()
            caches.open(CACHE).then((c) => c.put(richiesta, copia))
          }
          return risposta
        })
        .catch(() => cache)
      return cache || rete
    }),
  )
})
