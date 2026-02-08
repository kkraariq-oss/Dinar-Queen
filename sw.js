// ==========================================
// Service Worker - دينار كوين V3.0
// Supabase Only - No Firebase
// ==========================================

const CACHE_NAME = 'dinar-queen-v4'; // Incremented version
const urlsToCache = [
  '/Dinar-Queen/',
  '/Dinar-Queen/index.html',
  '/Dinar-Queen/style.css',
  '/Dinar-Queen/app.js',
  '/Dinar-Queen/logo.png',
  '/Dinar-Queen/background.jpg',
  '/Dinar-Queen/icon-192.png',
  '/Dinar-Queen/icon-512.png',
  '/Dinar-Queen/apple-touch-icon.png',
  '/Dinar-Queen/manifest.json',
  // External libraries
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - create cache
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Cache failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests (always fetch fresh)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          // Update cache in background for next time
          fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, response.clone());
                });
              }
            })
            .catch(() => {
              // Network error, cached version already returned
            });
          
          return cachedResponse;
        }

        // No cache, fetch from network
        return fetch(request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone and cache response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error);
            
            // If navigation request fails, return offline page
            if (request.mode === 'navigate') {
              return caches.match('/Dinar-Queen/index.html');
            }

            // Return offline response for other requests
            return new Response('تطبيق Dinar Queen - غير متصل بالإنترنت', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// Message event - handle messages from app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification event (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد',
    icon: '/Dinar-Queen/icon-192.png',
    badge: '/Dinar-Queen/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'dinar-queen-notification'
  };

  event.waitUntil(
    self.registration.showNotification('دينار كوين', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/Dinar-Queen/')
  );
});

console.log('[SW] Service Worker loaded successfully');