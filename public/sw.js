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

// Handle background sync for failed requests (Phase 4)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "sync-job-submission") {
    event.waitUntil(syncJobSubmission());
  } else if (event.tag === "sync-profile-update") {
    event.waitUntil(syncProfileUpdate());
  } else if (event.tag === "sync-favorite-add") {
    event.waitUntil(syncFavoriteAdd());
  } else if (event.tag === "sync-jobs") {
    event.waitUntil(syncJobsData());
  } else if (event.tag.startsWith("sync-")) {
    // Generic sync handler for any sync-* tag
    event.waitUntil(processGenericSync(event.tag));
  }
});

// Handle periodic background sync (Phase 5)
self.addEventListener("periodicsync", (event) => {
  console.log("[SW] Periodic sync event:", event.tag);

  if (event.tag === "sync-jobs") {
    // Update job listings every 24 hours
    event.waitUntil(syncJobsData());
  } else if (event.tag === "sync-profile") {
    // Update user profile periodically
    event.waitUntil(syncUserProfile());
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
    url: "/jobs",
  };

  if (event.data) {
    try {
      const jsonData = event.data.json();
      notificationData = { ...notificationData, ...jsonData };
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
      vibrate: [200, 100, 200],
      actions: [
        {
          action: "open",
          title: "View Job",
          icon: "/icon-96.png",
        },
        {
          action: "close",
          title: "Dismiss",
          icon: "/icon-96.png",
        },
      ],
    })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/jobs";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if app window is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.tag);
});

// Helper functions for syncing

async function syncJobsData() {
  try {
    console.log("[SW] Syncing jobs data");
    const response = await fetch("/api/jobs?fresh=true");
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      await cache.put("/jobs", response.clone());
      console.log("[SW] Jobs data synced successfully");
    }
  } catch (error) {
    console.log("[SW] Jobs sync failed:", error);
    throw error;
  }
}

async function syncUserProfile() {
  try {
    console.log("[SW] Syncing user profile");
    const response = await fetch("/api/profile");
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      await cache.put("/api/profile", response.clone());
      console.log("[SW] Profile synced successfully");
    }
  } catch (error) {
    console.log("[SW] Profile sync failed:", error);
    throw error;
  }
}

async function syncJobSubmission() {
  try {
    console.log("[SW] Processing queued job submissions");
    const response = await fetch("/api/sync/job-submissions");
    if (response.ok) {
      console.log("[SW] Job submissions synced");
    }
  } catch (error) {
    console.log("[SW] Job submission sync failed:", error);
    throw error;
  }
}

async function syncProfileUpdate() {
  try {
    console.log("[SW] Processing queued profile updates");
    const response = await fetch("/api/sync/profile-updates");
    if (response.ok) {
      console.log("[SW] Profile updates synced");
    }
  } catch (error) {
    console.log("[SW] Profile update sync failed:", error);
    throw error;
  }
}

async function syncFavoriteAdd() {
  try {
    console.log("[SW] Processing queued favorite additions");
    const response = await fetch("/api/sync/favorites");
    if (response.ok) {
      console.log("[SW] Favorites synced");
    }
  } catch (error) {
    console.log("[SW] Favorite sync failed:", error);
    throw error;
  }
}

async function processGenericSync(tag) {
  try {
    console.log("[SW] Processing generic sync:", tag);
    // Extract the type from the tag (e.g., "sync-custom-type" -> "custom-type")
    const syncType = tag.substring(5);
    const response = await fetch(`/api/sync/${syncType}`);
    if (response.ok) {
      console.log("[SW] Generic sync processed:", tag);
    }
  } catch (error) {
    console.log("[SW] Generic sync failed:", tag, error);
    throw error;
  }
}
