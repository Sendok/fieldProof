const SHELL_CACHE = "fieldproof-shell-v2";
const TASK_CACHE = "fieldproof-tasks-v2";
const ACTIVE_CACHES = new Set([SHELL_CACHE, TASK_CACHE]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(["/"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("fieldproof-") && !ACTIVE_CACHES.has(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_PRIVATE_CACHES") {
    event.waitUntil(Promise.all([caches.delete(SHELL_CACHE), caches.delete(TASK_CACHE)]));
  }
});

async function networkFirst(request, cacheName, fallbackMessage) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      void caches.open(cacheName).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response(fallbackMessage, {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(networkFirst(request, SHELL_CACHE, "Aset aplikasi belum tersedia offline."));
    return;
  }

  const isTask =
    url.pathname.startsWith("/app/my-tasks") ||
    /^\/app\/work-orders\/[^/]+\/execute$/.test(url.pathname);
  if (isTask) {
    event.respondWith(networkFirst(request, TASK_CACHE, "Tugas ini belum tersedia offline."));
  }
});
