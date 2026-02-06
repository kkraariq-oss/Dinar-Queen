// Service Worker - دينار كوين
const CACHE_NAME = 'dinar-coin-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './logo.png',
  './background.jpg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// التثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('فتح الذاكرة المؤقتة');
        return cache.addAll(urlsToCache);
      })
  );
});

// التفعيل
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف الذاكرة المؤقتة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع من الذاكرة المؤقتة أو جلب من الشبكة
        return response || fetch(event.request);
      })
      .catch(() => {
        // إرجاع صفحة offline إذا كانت متوفرة
        return caches.match('./index.html');
      })
  );
});
