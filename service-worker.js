self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
// Minimal fetch handler keeps Chrome happy for installability
self.addEventListener('fetch', () => {});
