// Minimal MechMate service worker: app-shell offline support.
// API + AI calls always go to network (never serve stale learning data).
const CACHE = "mechmate-v1";
const CORE = ["/", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // learning data: network only
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ||
        fetch(event.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        })
    )
  );
});
