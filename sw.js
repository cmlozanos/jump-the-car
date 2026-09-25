importScripts('./offline-assets.js');
var CACHE_NAME = 'jump-the-car-v1.5.1';
self.addEventListener('install', function (event) {
    event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(OFFLINE_ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (key) { return key.indexOf('jump-the-car-') === 0 && key !== CACHE_NAME; }).map(function (key) { return caches.delete(key); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
    var request = event.request;
    if (request.method !== 'GET' || request.url.indexOf(self.registration.scope) !== 0) return;
    event.respondWith(fetch(request).then(function (response) {
        if (response.ok) { var copy = response.clone(); event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.put(request,copy); })); }
        return response;
    }).catch(function () { return caches.match(request).then(function (cached) {
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
    }); }));
});
self.addEventListener('message', function (event) { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });
