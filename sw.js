const CACHE_NAME = 'wheru-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('WherU: Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('WherU: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('WherU: App shell cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('WherU: Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('WherU: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('WherU: Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('WherU: Serving from cache:', event.request.url);
          return response;
        }

        console.log('WherU: Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for location updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'location-sync') {
    console.log('WherU: Background sync - location update');
    event.waitUntil(syncLocationData());
  }
});

// Push notifications for friend updates
self.addEventListener('push', (event) => {
  console.log('WherU: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Friend location updated',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'view',
        title: 'View on Map',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('WherU', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('WherU: Notification clicked');
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync location data function
async function syncLocationData() {
  try {
    // TODO: Implement actual location sync with backend
    console.log('WherU: Syncing location data in background');
    
    // This would connect to your backend API
    // const response = await fetch('/api/sync-location', {
    //   method: 'POST',
    //   body: JSON.stringify(locationData)
    // });
    
    return Promise.resolve();
  } catch (error) {
    console.error('WherU: Location sync failed:', error);
    return Promise.reject(error);
  }
}