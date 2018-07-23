const BASE_API_URL = `https://mars-photos.herokuapp.com/api/v1/`;
const resizeUrlUnsecure = `http://rsz.io/`;
const resizeUrl = `https://rsz.io/`;
const viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
let resizeImg = true;

// check if resize API is available. 1000ms is enough
checkResizeApi = (url, options = {}) => {
    return fetchTimeout(url, options);
}

fetchTimeout = (url, options, timeout = 1000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(`calling ${url} timeout error`)
            }, timeout)
        })
    ]);
}


makeUrl = (imgUrl, resize, width = `600`, height = `600`, quality = 75) => {
   
    imgUrl = imgUrl.replace('http://', '').replace('https://', '')
    if (resize) {
        return `${resizeUrl}${imgUrl}?width=${width}&height=${height}&scale=down&quality=${quality}`;
    } else {
        // resize API is unavailable
        return `https://${imgUrl}`;
    }
}
    

document.addEventListener('DOMContentLoaded', event => {
    if (location.pathname.startsWith('/curiosity')) document.getElementById('home-page-link').href = '/curiosity-mars';
    if (location.pathname.startsWith('/curiosity')) document.getElementById('manifest-link').href = '/curiosity-mars/manifest/manifest.webmanifest';
    
    checkResizeApi(resizeUrl)
    .catch(error => {
        // resize API timeout error!
        resizeImg = false;
        console.log(error);
    })
    .then(response => {
        const datePicker = document.getElementById('input-date-search');
        datePicker.addEventListener('change', event => {
            closeModal();
            if (datePicker.value !== "") {
                fillPhotosByEarthDate(datePicker.value);
            } else {
                fillLatestPhotos();
            }
        })
        registerSW();
        openIDB();  
        fillLatestPhotos();
    })
});

fillLatestPhotos = () => {
    cleanMainPage();
    setPhotosCaption(`Loading latest photos`, '...');
    fetchLatestPhotos().then(data => {
        if (data.length > 0) {
            document.getElementById('input-date-search').value = data[0].earth_date;
            setPhotosCaption(`Photos taken on`, data[0].earth_date, data.length);
            updatePhotoList(data);
        } else {
            setPhotosCaption(`Nothing found`, ``, 0);
        }        
    });
}

fillPhotosByEarthDate = (date) => {
    cleanMainPage();
    setPhotosCaption(`Searching`, '...');
    fetchPhotosByEarthDate(date).then(data => {
        if (data.length > 0) {
            setPhotosCaption(`Photos taken on`, date, data.length);
            updatePhotoList(data);
        } else {
            setPhotosCaption(`Nothing found`, `( Date: ${date} )`, 0);
        }
    });
}

cleanMainPage = () => {
    let photoList = document.getElementById('photos-list');
    photoList.innerHTML = '';
    let totalPhotos = document.getElementById('total-photos');
    totalPhotos.innerHTML = ''
}

setSearchCurrentDate = () => {
    let calend = document.getElementById('input-date-search');
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate() ;
    calend.value = `${year}-${month}-${day}`;
}

setPhotosCaption = (type = 'Latest Photos', date = '', count = 0) => {
    let amount = "";
    if (count !== 0) {
        amount = `${count} photo(s)`;
    }
    let caption = document.getElementById('photos-caption');
    if (date === '') {
        caption.textContent = type
    } else {
        caption.textContent = `${type} ${date}`
    }

    document.getElementById('total-photos').innerHTML = amount;
}

fetchLatestPhotos = () => {
    return fetch(`${BASE_API_URL}rovers/curiosity/latest_photos`).then(response => {
        return response.json();
    }).then(data => {
        return data.latest_photos;
    }).catch(error => {
        console.log(error);
    })
}

fetchPhotosByEarthDate = (date) => {
    return fetch(`${BASE_API_URL}rovers/curiosity/photos?earth_date=${date}`).then(response => {
        return response.json();
    }).then(data => {
        return data.photos;
    }).catch(error => {
        console.log(error);
    })
}

fetchRoverInfo = (name) => {
    return fetch(`${BASE_API_URL}manifests/curiosity`).then(response => {
        return response.json();
    }).then(data => {
        console.log(data.photo_manifest);
    }).catch(error => {
        console.log(error);
    })
}

updatePhotoList = (data) => {
    for (const photo of data) {
        setImgPlaceHolder(photo);
    }
    lazyLoad();
}
// create placeHolder for picture for future lazy-load
setImgPlaceHolder = (imgData) => {
    let photoList = document.getElementById('photos-list');
    const li = document.createElement('li');
    li.setAttribute('id', imgData.id);
    li.style.backgroundPosition = 'center';
    const imgWrap = document.createElement('div');
    imgWrap.className = 'lazy-img';
    imgWrap.setAttribute('data-src', imgData.img_src)
    imgWrap.setAttribute('data-alt', `The photo was made by ${imgData.rover.name} with ${imgData.camera.full_name} on ${imgData.earth_date}`);
    imgWrap.setAttribute('data-class', 'img-list');
    imgWrap.setAttribute('data-id', imgData.id);

    const a = document.createElement('a');
    a.setAttribute('props', JSON.stringify(imgData));
    a.href = '/';
    a.className = 'link-list';
    a.addEventListener('click', (event) => {
        event.preventDefault();
        const lastFocusedElement = document.activeElement;
        showPhotoDetails(imgData, lastFocusedElement)
    }, this);
    a.appendChild(imgWrap);
    li.appendChild(a);
    photoList.appendChild(li);
}

/************************* 
* Lazy-loading pictures
*************************/
const config = {
    // If the image gets within 50px in the Y axis, start the download.
    rootMargin: '50px 0px',
    threshold: 0.01
};
  
let observer = new IntersectionObserver(onIntersection, config);
  
// Get all of the elements that are marked up to lazy load
lazyLoad = () => {
const images = document.querySelectorAll('.lazy-img');
if (!('IntersectionObserver' in window)) {
        // no oberver. load all pictures 
        console.log('no observer');
        for (const image of images) {
            loadImage(image);
        }
    } else {
        for (const image of images) {
            observer.observe(image);
        }
    }
}

function onIntersection(entries) {
    for (const entry of entries) {
        if (entry.intersectionRatio > 0) {
            // Stop watching and load the image
            observer.unobserve(entry.target);
            loadImage(entry.target);
        }
    }
}


loadImage = (image_src) => {
    const pic = makePictureElem(image_src.dataset.src, image_src.dataset.alt, image_src.dataset.class, image_src.dataset.id);
    image_src.append(pic);
}

// ---- photo details modal
let firstTabStop = null;
let lastTabStop = null;
let modal = null;
let focusOnExit = null;

showPhotoDetails = (data, lastFocusedElement) => {
    // hide search-results
    document.getElementById("search-results").style.display = "none";
    

    focusOnExit = lastFocusedElement;
    modal = document.getElementById('photo-detail-back');
    modal.style.display = "block";
    let modalContentElement = document.getElementById("photo-detail");
    const detailPhotoWrapper = document.createElement("div");
    const picDescr = `The photo was made by ${data.rover.name} with ${data.camera.full_name} on ${data.earth_date} (sol ${data.sol})`;
    const modalContentImg = makePictureElem(data.img_src, picDescr);
    modalContentImg.addEventListener('click', closeModal);

    detailPhotoWrapper.appendChild(modalContentImg);


    const detailDescrWrapper = document.createElement("div");
    detailDescrWrapper.className = "photo-detail-descr";
    detailDescrWrapper.innerHTML = picDescr;
    
    const fullImgDescr = document.createElement('p');
    fullImgDescr.innerHTML = `<a href="${data.img_src}" class="new-tab-link" target="_blank">open photo in new tab</a>`;
    modalContentElement.appendChild(detailPhotoWrapper);
    modalContentElement.appendChild(detailDescrWrapper);
    modalContentElement.appendChild(fullImgDescr);

   
    const btnCloseModal = document.createElement('button');
    btnCloseModal.setAttribute('id', 'btn-close-modal');
    btnCloseModal.innerHTML = "× Close"
    modalContentElement.appendChild(btnCloseModal);
    btnCloseModal.addEventListener("click", closeModal);


    modalContentElement.style.backgroundImage = "url('/img/loading.svg')";
    modalContentElement.style.backgroundRepeat = "no-repeat";
    modalContentElement.style.backgroundPosition = "center";
    

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = event => {
        if (event.target == modal) closeModal();
    }
    // When user press escape, close the modal
    document.onkeydown = event => {
        if (event.keyCode === 27) closeModal();
    }

    modal.addEventListener('keydown', trapTabKey);
    
    // focusable elements in modal
    const focusableElementsString = 'button, a';
    let focusableElements = modal.querySelectorAll(focusableElementsString);
    // convert nodelist to array
    focusableElements = Array.prototype.slice.call(focusableElements);
    
    firstTabStop = focusableElements[0];
    lastTabStop = focusableElements[focusableElements.length - 1];
    
    // focusing on first stop
    firstTabStop.focus();

    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

}

makePictureElem = (picUrl, picDescr, className = '', id = '') => {
    const picElem = document.createElement("picture");
    let picSource600 = document.createElement("source");
    picSource600.setAttribute('srcset',  makeUrl(picUrl, resizeImg, `600`, `600`,30));
    picSource600.setAttribute('media', `(max-width: 600px)`);
    picSource600.setAttribute('type', `image/jpeg`);
    picElem.appendChild(picSource600);
    
    let picSource800 = document.createElement("source");
    picSource800.setAttribute('srcset', makeUrl(picUrl, resizeImg, `800`, `800`,50)) ;
    picSource800.setAttribute('media', `(min-width: 601px) and (max-width: 800px)`);
    picSource800.setAttribute('type', `image/jpeg`);
    picElem.appendChild(picSource800);
    
    let picSourceBig = document.createElement("source");
    picSourceBig.setAttribute('srcset',  makeUrl(picUrl, resizeImg, id ? `400` :`1000`, id ? `400` :`1000`));
    picSourceBig.setAttribute('media', `(min-width: 801px)`);
    picSourceBig.setAttribute('type', `image/jpeg`);
    picElem.appendChild(picSourceBig);
    
    let imgSource = document.createElement("img");
    imgSource.setAttribute('src', makeUrl(picUrl, false));
    imgSource.setAttribute('alt',  picDescr);
    imgSource.className = className;
    picElem.appendChild(imgSource);

    imgSource.addEventListener('load', () => {
        imgSource.style.opacity = 1;
        document.getElementById('photo-detail').style.backgroundImage = "none";
        if (id) {
            if (document.getElementById(id)) document.getElementById(id).style.backgroundImage = "none";
        }
    });

    return picElem;
}

trapTabKey = (e) => {
    // first tab pressed
    if (e.keyCode === 9) {
        // shift + tab pressed
        if (e.shiftKey) {
            if (document.activeElement === firstTabStop) {
                e.preventDefault();
                lastTabStop.focus();
            }
        } else {
        // tab pressed
            if (document.activeElement === lastTabStop) {
                e.preventDefault();
                firstTabStop.focus();
            }
        }
    }
}

closeModal = () => {
    const modal = document.getElementById('photo-detail-back');
    modal.style.display = "none";
    document.getElementById("photo-detail").innerHTML = "";
    
    // show search-results
    document.getElementById("search-results").style.display = "block";
    if (focusOnExit) focusOnExit.focus();

}


// Scroll Top Button
// When the user scrolls down 20px from the top of the document, show the button
// Only if viewport is <= 400px
const matchVP = window.matchMedia("(max-width: 400px)")
checkVP(matchVP) // Call listener function at run time
matchVP.addListener(checkVP) // Attach listener function on state changes
function checkVP(matchVP) {
    if (matchVP.matches) { // If media query matches
        window.onscroll = function() {
            scrollFunction()
        };
    }
}

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("btnScrollUp").style.display = "block";
    } else {
        document.getElementById("btnScrollUp").style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
// Register SW
registerSW = () => {
    if (navigator.serviceWorker) {
        let swPath = "/sw.js";
        if (location.pathname.startsWith('/curiosity')) swPath = "/curiosity-mars/sw.js";
        navigator.serviceWorker.register(swPath).then(function(reg) {
            if (!navigator.serviceWorker.controller) {
                return;
            }
            
            if (reg.waiting) {
                updateWorker(reg.waiting);
                return;
            }

            if (reg.installing) {
                trackWorker(reg.installing);
                return;
            }

            reg.addEventListener('updatefound', () => {
                trackWorker(reg.installing);
                return;
            });

            trackWorker = (worker) => {
                worker.addEventListener('statechange', () => {
                    if (worker.state === 'installed') updateWorker(worker);
                })
            }

            updateWorker = (worker) => {
                worker.postMessage({action: 'skipWaiting'});
            }

            // Ensure refresh is only called once.
            // This works around a bug in "force update on reload".
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload(true);
            refreshing = true;
            });    
        }).catch(error => {
            console.log(error);
        })
    }
}

// Creating IndexedDB
openIDB = () => {
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }    

    return idb.open('marsDB', 1, db => {
        switch(db.oldVersion) {
            case 0: 
            db.createObjectStore('photos', {keyPath: 'id'});
            db.createObjectStore('manifest', {keyPath: 'name'});
        }
    });
}