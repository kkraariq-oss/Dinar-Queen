// Service Worker - دينار كوين V2.0
const CACHE_NAME = 'dinar-coin-v2';
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
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// التثبيت وإنشاء الكاش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// التفعيل وحذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
  // تجاهل طلبات POST
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // إرجاع من الكاش إن وُجد
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // جلب من الشبكة
      return fetch(event.request).then(response => {
        // التحقق من صحة الاستجابة
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // حفظ نسخة في الكاش
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // في حالة عدم وجود إنترنت وعدم وجود كاش
        if (event.request.mode === 'navigate') {
          return caches.match('/Dinar-Queen/index.html');
        }
        return new Response('Offline - لا يوجد اتصال بالإنترنت', {
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