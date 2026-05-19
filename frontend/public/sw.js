const CACHE = "financescout-v2";
const STATIC_URLS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** HTML sayfaları her zaman ağdan; yalnızca statik dosyalar önbelleğe alınır. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isHtml =
    event.request.mode === "navigate" ||
    event.request.destination === "document" ||
    url.pathname.startsWith("/home") ||
    url.pathname === "/";

  if (isHtml) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => res)),
  );
});
