const CACHE_NAME = "weelink-v5";
const PRECACHE_URLS = ["/offline", "/manifest.webmanifest", "/weeelink.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: "window" }).then((clients) =>
          clients.forEach((c) => c.postMessage({ type: "SW_UPDATED" }))
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/v1")) {
    event.respondWith(fetch(request).catch(() => new Response('{"error":"offline"}', { headers: { "Content-Type": "application/json" } })));
    return;
  }

  // Immutable, content-hashed assets: safe to serve cache-first forever
  const isImmutableAsset = url.pathname.startsWith("/_next/static/");

  if (isImmutableAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached || new Response("", { status: 408 }));
      })
    );
    return;
  }

  // Icons, favicon, manifest, fonts, images: stale-while-revalidate.
  // Return cache immediately for speed, but always fetch fresh in the
  // background so updated icons/favicons propagate on the next load.
  const isVersionedStatic =
    /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$/.test(url.pathname) ||
    url.pathname === "/manifest.webmanifest";

  if (isVersionedStatic) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached || new Response("", { status: 408 }));
          return cached || network;
        })
      )
    );
    return;
  }

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
          caches.match(request).then((cached) => cached || caches.match("/offline"))
        )
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  let data = { title: "ویلینک", body: "یک پیام جدید دارید", icon: "/icons/icon-192.png?v=3" };
  try { data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192.png?v=3",
      badge: "/icons/icon-72.png?v=3",
      dir: "rtl",
      lang: "fa",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Background sync
if ("sync" in self.registration) {
  self.addEventListener("sync", (event) => {
    if (event.tag === "analytics-sync") {
      event.waitUntil(
        self.clients.matchAll().then((list) =>
          list.forEach((c) => c.postMessage({ type: "SYNC_ANALYTICS" }))
        )
      );
    }
  });
}
