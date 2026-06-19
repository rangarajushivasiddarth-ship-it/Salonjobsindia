// Version for cache busting
const CACHE_VERSION = "v2";
const CACHE_NAMES = {
  static: `salon-jobs-india-static-${CACHE_VERSION}`,
  dynamic: `salon-jobs-india-dynamic-${CACHE_VERSION}`,
  images: `salon-jobs-india-images-${CACHE_VERSION}`,
};

// Essential resources to cache on install
const STATIC_CACHE_URLS = [
  "/",
  "/manifest.json",
  "/offline.html",
  "/icon-72.png",
  "/icon-96.png",
  "/icon-128.png",
  "/icon-144.png",
  "/icon-152.png",
  "/icon-192.png",
  "/icon-384.png",
  "/icon-512.png",
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS).catch((err) => {
        console.log("[SW] Error caching static assets:", err);
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!Object.values(CACHE_NAMES).includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement cache strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external APIs and non-http(s)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Strategy: Network first for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAMES.dynamic);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html"));
        })
    );
    return;
  }

  // Strategy: Cache first for images
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAMES.images).then((cache) => {
                cache.put(request, response.clone());
              });
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Default: Network first with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAMES.dynamic).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        return (
          caches.match(request) || caches.match("/offline.html")
        );
      })
  );
});

// Handle background sync for failed requests
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-jobs") {
    event.waitUntil(syncJobsData());
  }
});

// Handle push notifications
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Salon Jobs India",
    body: "New job opportunities available",
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    tag: "salon-notification",
    requireInteraction: false,
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData,
    })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/jobs";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === urlToOpen && "focus" in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Helper function for background sync
async function syncJobsData() {
  try {
    const response = await fetch("/api/jobs");
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      await cache.put("/jobs", response.clone());
    }
  } catch (error) {
    console.log("[SW] Sync failed:", error);
    throw error;
  }
}
