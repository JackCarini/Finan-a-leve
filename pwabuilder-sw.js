// Stokfy - Service Worker
// Estratégia: Network First com cache versionado.
// Sempre que houver internet, busca a versão mais recente do servidor.
// Só usa o cache quando o dispositivo está offline.
// Sempre que você publicar mudanças no index.html (ou em qualquer arquivo),
// AUMENTE o número da versão abaixo (ex: 'stokfy-v2' -> 'stokfy-v3').
// Isso força o navegador a descartar o cache antigo e assumir o controle
// imediatamente, sem o usuário precisar limpar dados do app manualmente.

const CACHE_VERSION = 'stokfy-v3';

const ARQUIVOS_PARA_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.jpg',
  './icon-carrinho.svg'
];

// INSTALL: baixa e guarda uma cópia inicial dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ARQUIVOS_PARA_CACHE);
    })
  );
  // Ativa o novo service worker imediatamente, sem esperar
  // todas as abas antigas fecharem.
  self.skipWaiting();
});

// ACTIVATE: apaga qualquer cache de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomesCaches) => {
      return Promise.all(
        nomesCaches
          .filter((nome) => nome !== CACHE_VERSION)
          .map((nome) => caches.delete(nome))
      );
    })
  );
  // Assume o controle de todas as páginas abertas imediatamente
  self.clients.claim();
});

// FETCH: tenta a rede primeiro; só usa o cache se estiver offline
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET (ex: POST) para evitar erros de cache
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((respostaRede) => {
        // Atualiza o cache com a resposta mais recente da rede
        const copia = respostaRede.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, copia);
        });
        return respostaRede;
      })
      .catch(() => {
        // Sem internet: tenta servir a partir do cache
        return caches.match(event.request).then((respostaCache) => {
          return respostaCache || caches.match('./index.html');
        });
      })
  );
});

// Permite que a página force a ativação imediata de uma nova versão
// (usado junto com o trecho de "aviso de atualização" no index.html)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
