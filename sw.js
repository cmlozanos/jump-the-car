// Service Worker para Jump the Car PWA
// Versión del cache - incrementar cuando se actualicen los recursos
// IMPORTANTE: Debe coincidir con APP_VERSION en game.js
const CACHE_VERSION = 'v1.4.0';
const CACHE_NAME = `jump-the-car-${CACHE_VERSION}`;

// Recursos esenciales que deben estar siempre en cache
// Nota: Las rutas funcionan tanto en desarrollo local como en GitHub Pages
const ESSENTIAL_RESOURCES = [
  './',
  './index.html',
  './game.js',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Recursos adicionales para cachear (sprites, niveles, etc.)
const ADDITIONAL_RESOURCES = [
  // Sprites de coches
  './sprites/cars/car_1.svg',
  './sprites/cars/car_2.svg',
  './sprites/cars/car_3.svg',
  './sprites/cars/car_4.svg',
  './sprites/cars/car_5.svg',
  './sprites/cars/car_6.svg',
  './sprites/cars/car_7.svg',
  './sprites/cars/car_8.svg',
  './sprites/cars/car_9.svg',
  './sprites/cars/car_10.svg',
  './sprites/cars/car_11.svg',
  './sprites/cars/car_12.svg',
  './sprites/cars/car_13.svg',
  './sprites/cars/car_14.svg',
  './sprites/cars/car_shadow.svg',
  // Sprites de entorno
  './sprites/environment/goal.svg',
  './sprites/environment/obstacle.svg',
  './sprites/environment/spikes.svg',
  './sprites/environment/hole.svg',
  './sprites/environment/ufo.svg',
  './sprites/environment/fire.svg',
  './sprites/environment/tree.svg',
  './sprites/environment/settings.svg',
  './sprites/environment/close.svg',
  // Niveles (solo los primeros 20 para no sobrecargar el cache inicial)
  './sprites/levels/level_1.svg',
  './sprites/levels/level_2.svg',
  './sprites/levels/level_3.svg',
  './sprites/levels/level_4.svg',
  './sprites/levels/level_5.svg',
  './sprites/levels/level_6.svg',
  './sprites/levels/level_7.svg',
  './sprites/levels/level_8.svg',
  './sprites/levels/level_9.svg',
  './sprites/levels/level_10.svg',
  './sprites/levels/level_11.svg',
  './sprites/levels/level_12.svg',
  './sprites/levels/level_13.svg',
  './sprites/levels/level_14.svg',
  './sprites/levels/level_15.svg',
  './sprites/levels/level_16.svg',
  './sprites/levels/level_17.svg',
  './sprites/levels/level_18.svg',
  './sprites/levels/level_19.svg',
  './sprites/levels/level_20.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando recursos esenciales...');
        // Cachear recursos esenciales primero
        return cache.addAll(ESSENTIAL_RESOURCES.map(url => new Request(url, { cache: 'reload' })))
          .then(() => {
            console.log('[SW] Recursos esenciales cacheados');
            // Cachear recursos adicionales en segundo plano
            return cache.addAll(ADDITIONAL_RESOURCES.map(url => new Request(url, { cache: 'reload' })))
              .catch((err) => {
                console.warn('[SW] Algunos recursos adicionales no se pudieron cachear:', err);
              });
          })
          .catch((err) => {
            console.error('[SW] Error cacheando recursos:', err);
          });
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...', CACHE_NAME);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== CACHE_NAME && cacheName.startsWith('jump-the-car-')) {
              console.log('[SW] Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
  );
});

// Estrategia de cache: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo cachear solicitudes GET y del mismo origen
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }
  
  // Estrategia: Network First con fallback a Cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, actualizar el cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde el cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no hay cache, devolver una respuesta básica para HTML
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Manejo de mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_LEVEL') {
    // Cachear un nivel específico bajo demanda
    const levelNum = event.data.level;
    const levelUrl = `./sprites/levels/level_${levelNum}.svg`;
    
    caches.open(CACHE_NAME)
      .then((cache) => {
        return fetch(levelUrl)
          .then((response) => {
            if (response.ok) {
              cache.put(levelUrl, response);
              console.log(`[SW] Nivel ${levelNum} cacheado`);
            }
          })
          .catch((err) => {
            console.warn(`[SW] No se pudo cachear nivel ${levelNum}:`, err);
          });
      });
  }
});
