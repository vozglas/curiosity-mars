const cacheVersion = "1";

const staticCache = `static-cache-${cacheVersion}`;
const imageCache = `image-cache-${cacheVersion}`;

const allCaches = [staticCache, imageCache];

staticCacheLinks = [
    "/",
    "/index.html",
    "/js/main.js",
    "/css/style.css",
    "/img/cross64.png",
    "https://fonts.googleapis.com/css?family=Roboto"
]

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCache).then(cache => {
            return cache.addAll(staticCacheLinks);
        }).catch(error => {
            console.log(error);
        })
    )
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return !allCaches.includes(cacheName);
                }).map(cacheToDelete => {
                    return caches.delete(cacheToDelete);
                })
            )
        }).catch(error => {
            console.log(error);
        })
    )
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        console.log(requestUrl.pathname);
        event.respondWith(caches.match(requestUrl.pathname));     
        return;   
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    )
});


self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
})