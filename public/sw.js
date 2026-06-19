const CACHE_NAME = "salon-jobs-india-logo-final-v1";
const URLS_TO_CACHE = ["/", "/manifest.json"];

// Icon and manifest files should always use network-first strategy
const NETWORK_FIRST_PATTERNS = [
  /\/manifest\.json/,
  /\/icons\//,
  /\/sji-/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Network-first for icons, manifest, and favicons
  if (NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(event.request.url))) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(event.request).then((response) =>
      response || fetch(event.request)
    )
  );
});
