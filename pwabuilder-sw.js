const CACHE = "stokfy-pwa-v1";

const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json"
];

// Instalação do Service Worker e salvamento dos arquivos em cache local
self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições: tenta buscar na rede, se falhar (offline), busca no cache
self.addEventListener("fetch", (evt) => {
  if (evt.request.method !== "GET") return;

  evt.respondWith(
    fetch(evt.request)
      .then((response) => {
        // Se obteve sucesso na rede, atualiza o cache opcionalmente
        return response;
      })
      .catch(() => {
        return caches.match(evt.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback padrão para a página inicial caso a rota não seja encontrada
          if (evt.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
