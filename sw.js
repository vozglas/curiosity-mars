const cacheVersion = "2";

const staticCache = `static-cache-${cacheVersion}`;
const imageCache = `image-cache-${cacheVersion}`;
const allCaches = [staticCache, imageCache];

let beforePath = "";    

//check if we're on github
fetch('/').then(response => {
    if (response.url.indexOf("github.io") >= 0) beforePath = "/curiosity-mars";
}).catch(error => console.log(error));

staticCacheLinks = [
    `${beforePath}/`,
    `${beforePath}index.html`,
    `${beforePath}js/main.js`,
    `${beforePath}js/idb.js`,
    `${beforePath}css/style.css`,
    `${beforePath}img/cross64.png`,
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