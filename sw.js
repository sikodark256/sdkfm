/* =========================================================
   Service Worker MEJORADO — Actualizaciones automáticas
   ========================================================= */

// 🆕 Cambia este número cada vez que subas una versión nueva
const CACHE_VERSION = "sikodark-radio-v2";

// Archivos que se guardan en caché (recursos estáticos que no cambian)
const ASSETS_ESTATICOS = [
  "./",
  "./manifest.json",
  "./apple-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon.svg",
  "./icon-light-32x32.png",
  "./icon-dark-32x32.png",
  "./logo-radio.png"
];

// 📥 Al instalar: guarda los recursos estáticos
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(ASSETS_ESTATICOS))
      .then(() => self.skipWaiting()) // Activarse inmediatamente
  );
});

// 🧹 Al activarse: borra cachés viejas
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_VERSION)
            .map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// 🌐 Al solicitar un recurso:
//    • index.html → PRIMERO busca en RED (para tener siempre la última versión)
//    • el resto → primero busca en caché, luego en red
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Solo manejar peticiones de nuestro origen
  if (url.origin !== location.origin) return;

  // 📄 Para index.html: NETWORK FIRST (siempre actualizado)
  if (url.pathname.endsWith("/") || url.pathname.endsWith("index.html")) {
    e.respondWith(
      fetch(e.request)
        .then(respuesta => {
          // Guardar la nueva versión en caché
          const copia = respuesta.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, copia));
          return respuesta;
        })
        .catch(() => caches.match(e.request)) // Si no hay red, usar caché
    );
    return;
  }

  // 🖼️ Para el resto (imágenes, íconos): CACHE FIRST
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request)
        .then(respuesta => {
          // Guardar en caché para la próxima vez
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_VERSION).then(c => c.put(e.request, copia));
          }
          return respuesta;
        })
        .catch(() => {})
      )
  );
});

// 🔔 Mensaje desde la página para forzar actualización
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
