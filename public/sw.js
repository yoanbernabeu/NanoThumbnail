/*
 * NanoThumbnail service worker — makes the studio installable and usable offline
 * (your images live in IndexedDB, so the library works without network).
 *
 * - Pages: network first, cached copy when offline.
 * - /assets/* (content-hashed): cache first.
 * - Everything else (APIs, functions, cross-origin): untouched.
 */
const VERSION = 'v2-1';
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const SHELL = ['./app/', './manifest.webmanifest', './favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/.netlify/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(PAGES).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./app/')) || Response.error()),
    );
    return;
  }

  if (url.pathname.includes('/assets/') || url.pathname.endsWith('.woff2')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) caches.open(ASSETS).then((c) => c.put(request, res.clone()));
            return res;
          }),
      ),
    );
  }
});
