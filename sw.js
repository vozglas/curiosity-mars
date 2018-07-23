const cacheVersion = "3";


const staticCache = `static-cache-${cacheVersion}`;
const imageCache = `image-cache-${cacheVersion}`;
const allCaches = [staticCache, imageCache];

let startPath = "/";
if (location.pathname.startsWith('/curiosity')) startPath = "/curiosity-mars/"; 

staticCacheLinks = [
    `${startPath}`,
    `${startPath}index.html`,
    `${startPath}js/intersection-observer.js`,
    `${startPath}js/main.js`,
    `${startPath}js/idb.js`,
    `${startPath}css/style.css`,
    `${startPath}img/cross64.png`,
    `${startPath}img/loading.svg`,
    `${startPath}manifest.webmanifest`,
    `${startPath}manifest_github.webmanifest`,
    "https://fonts.googleapis.com/css?family=Roboto"
]

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCache).then(cache => {
            return cache.addAll(staticCacheLinks);
        }).catch(error => {
            console.log(new Error(error));
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
    console.log(`got message ${event.data.action}`)
    if (event.data.action === 'skipWaiting') {
        return self.skipWaiting();
    }
})