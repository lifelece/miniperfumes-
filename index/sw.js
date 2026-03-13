const CACHE_NAME = 'cbo-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/api.js',
    '/js/cart.js',
    '/js/ui.js',
    'https://unpkg.com/aos@2.3.1/dist/aos.css',
    'https://unpkg.com/aos@2.3.1/dist/aos.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalar Service Worker y Cachear Assets Críticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cacheando assets estáticos - Fase Install');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Stale-While-Revalidate (SWR): Servir rápido de Caché, pero actualizar de fondo
self.addEventListener('fetch', (event) => {
    // Solo interceptar peticiones GET
    if (event.request.method !== 'GET') return;
    
    // Evitar cachear llamadas a APIs dinámicas de Google Apps Script o CDN de imágenes si el referrer policy molesta (Se deja pasar natural)
    if (event.request.url.includes('script.google.com') || event.request.url.includes('pravatar.cc') || event.request.url.includes('cdn')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Actualizamos la caché en segundo plano de manera segura
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si la red falla y no está en caché (Offline agresivo), se devuelve cache o error vacío handled.
                return cachedResponse;
            });

            // Si hay caché, devolverla INSTANT. Si no, esperar a la red (SWR Strategy)
            return cachedResponse || fetchPromise;
        })
    );
});

// Limpiar CACHES viejos cuando el SW se actualiza
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Eliminando caché obsoleta:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
