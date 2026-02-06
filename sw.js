// Service Worker - دينار كوين
const CACHE_NAME = 'dinar-coin-v1';
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
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// التثبيت
self.addEventListener('install', event => {
  event.respondWith(
    // تجاهل طلبات POST للكاش
    event.request.method === 'POST'
      ? fetch(event.request)
      : fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              if (event.request.mode === 'navigate') {
                return caches.match('/Dinar-Queen/index.html');
              }
              return new Response('Offline - لا يوجد اتصال بالإنترنت', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
          })
  );
      .then(response => {
        // إرجاع من الذاكرة المؤقتة أو جلب من الشبكة
        return response || fetch(event.request);
      })
      .catch(() => {
        // إرجاع صفحة offline إذا كانت متوفرة
        return caches.match('/Dinar-Queen/index.html');
      })
  );
});
