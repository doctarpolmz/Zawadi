const CACHE_NAME = 'zawadi-v1'
const STATIC_ASSETS = [
  '/',
  '/browse/movies',
  '/browse/music',
  '/browse/books',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and Supabase API calls
  if (request.method !== 'GET') return
  if (url.hostname.includes('supabase.co')) return
  if (url.hostname.includes('mux.com')) return

  // For downloaded content (stored in IndexedDB), serve from IDB
  if (url.pathname.startsWith('/offline/')) {
    event.respondWith(serveOfflineContent(url.pathname))
    return
  }

  // Network-first for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok && !url.pathname.startsWith('/api/')) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone))
        }
        return res
      })
    })
  )
})

async function serveOfflineContent(pathname) {
  // Retrieve from IndexedDB where downloads are stored
  return new Response('Offline content', { status: 200 })
}

// Background sync for watch progress
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress())
  }
})

async function syncProgress() {
  // When back online, flush queued progress updates to Supabase
  const db = await openIDB()
  const tx = db.transaction('progress-queue', 'readwrite')
  const store = tx.objectStore('progress-queue')
  const items = await store.getAll()
  for (const item of items) {
    try {
      await fetch('/api/sync-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      await store.delete(item.id)
    } catch { /* leave for next sync */ }
  }
}

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('zawadi', 1)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('downloads')) {
        db.createObjectStore('downloads', { keyPath: 'contentId' })
      }
      if (!db.objectStoreNames.contains('progress-queue')) {
        db.createObjectStore('progress-queue', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
}
