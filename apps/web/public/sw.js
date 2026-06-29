const CACHE_NAME = "weelink-v1";
const PRECACHE_URLS = ["/", "/offline", "/manifest.webmanifest"];

// Install: precache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network only, no cache
  if (url.pathname.startsWith("/api/v1")) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache first, network fallback
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests: network first, fallback to cache, fallback to /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline"))
        )
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Background sync for offline analytics
if ("sync" in self.registration) {
  self.addEventListener("sync", (event) => {
    if (event.tag === "analytics-sync") {
      event.waitUntil(
        (async () => {
          try {
            // Flush any queued analytics events stored in IndexedDB or postMessage
            const clients = await self.clients.matchAll();
            clients.forEach((client) =>
              client.postMessage({ type: "SYNC_ANALYTICS" })
            );
          } catch (err) {
            console.error("[SW] analytics sync failed", err);
          }
        })()
      );
    }
  });
}
