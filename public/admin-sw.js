// Apenas a tela offline é armazenada. Dados, autenticação e agenda usam a rede.
self.addEventListener('install', event => {
  event.waitUntil(caches.open('melanina-admin-offline-v1').then(cache => cache.add('/admin-offline.html')));
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !/^\/admin\/?$/.test(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match('/admin-offline.html')));
});