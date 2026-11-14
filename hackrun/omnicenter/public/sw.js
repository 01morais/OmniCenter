// Service worker: a home abre rápido com sinal fraco. Páginas: rede primeiro, cache como reserva. Estáticos: cache primeiro.
const V = "omni-v1", SHELL = ["/", "/icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api") || u.pathname.startsWith("/painel")) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then((x) => { const c = x.clone(); caches.open(V).then((k) => k.put(r, c)); return x; }).catch(() => caches.match(r).then((m) => m || caches.match("/"))));
  } else {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((x) => { const c = x.clone(); caches.open(V).then((k) => k.put(r, c)); return x; })));
  }
});
