// Calculadora de Dosis Veterinaria — © 2026 Jesús Ventura. Todos los derechos reservados.
// Software propietario — ver LICENSE en la raíz del repositorio. Prohibida su copia,
// modificación, distribución o reutilización, total o parcial, sin autorización por escrito.

const CACHE_NAME = "dosis-vet-cache-v7";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./storage.js",
  "./manifest.json",
  "./icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// "Red primero, caché como respaldo": siempre que haya conexión se usa la versión más
// reciente del servidor (y se guarda en caché para la próxima vez); solo si falla la
// petición (sin conexión) se sirve la última copia guardada. Con la estrategia anterior
// ("caché primero") cualquier actualización de la app se quedaba invisible para siempre
// en cuanto un navegador ya tenía el service worker instalado, salvo que se cambiara a mano
// el nombre de CACHE_NAME en cada despliegue — algo fácil de olvidar y que ya ha pasado.
// "cache: no-store" es imprescindible aquí: sin él, fetch() dentro del service worker sigue
// respetando la caché HTTP normal del navegador (Cache-Control/ETag), que NO se salta ni con
// una recarga forzada (Ctrl+Shift+R) hecha por el usuario — esa recarga solo afecta a la
// petición de navegación inicial, no a las peticiones que el propio service worker repite por
// dentro. Sin esto, tras desplegar un cambio los usuarios podían seguir viendo la versión
// vieja hasta que expirase la caché HTTP del servidor (varios minutos), pareciendo que la app
// nunca se actualiza aunque el fetch handler ya fuera "red primero".
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(event.request))
  );
});
