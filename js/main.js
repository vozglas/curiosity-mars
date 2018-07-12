const BASE_URL = `https://mars-photos.herokuapp.com/api/v1/`;

document.addEventListener('DOMContentLoaded', event => {
    const datePicker = document.getElementById('input-date-search');
    datePicker.addEventListener('change', event => {
        if (datePicker.value !== "") {
            fillPhotosByEarthDate(datePicker.value);
        } else {
            fillLatestPhotos();
        }

    })
    registerSW();
    openIDB();  

    fillLatestPhotos();
});

fillLatestPhotos = () => {
    cleanMainPage();
    setPhotosCaption(`Loading latest photos`, '...');
    fetchLatestPhotos().then(data => {
        setPhotosCaption();
        updatePhotoList(data);
    });
}

fillPhotosByEarthDate = (date) => {
    cleanMainPage();
    setPhotosCaption(`Searching`, '...');
    return fetchPhotosByEarthDate(date).then(data => {
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
    return fetch(`${BASE_URL}rovers/curiosity/latest_photos`).then(response => {
        return response.json();
    }).then(data => {
        return data.latest_photos;
    }).catch(error => {
        console.log(error);
    })
}

fetchPhotosByEarthDate = (date) => {
    return fetch(`${BASE_URL}rovers/curiosity/photos?earth_date=${date}`).then(response => {
        return response.json();
    }).then(data => {
        return data.photos;
    }).catch(error => {
        console.log(error);
    })
}

fetchRoverInfo = (name) => {
    return fetch(`${BASE_URL}manifests/curiosity`).then(response => {
        return response.json();
    }).then(data => {
        console.log(data.photo_manifest);
    }).catch(error => {
        console.log(error);
    })
}

updatePhotoList = (data) => {
    let photoList = document.getElementById('photos-list');
    for (const photo of data) {
        const li = document.createElement('li');
        const img = document.createElement('img');
        img.setAttribute('src', photo.img_src);
        img.setAttribute('alt', `The photo was made by ${photo.rover.name} with ${photo.camera.full_name} on ${photo.earth_date}`);
        img.className = 'img-list';
        const a = document.createElement('a');
        a.setAttribute('props', JSON.stringify(photo));
        a.href = '/';
        a.className = 'link-list';
        a.addEventListener('click', (event) => {
            event.preventDefault();
            const lastFocusedElement = document.activeElement;
            showPhotoDetails(photo, lastFocusedElement)
        }, this);
        a.appendChild(img);
        li.appendChild(a);
        photoList.appendChild(li);
    }
}



// ---- photo details modal
let firstTabStop = null;
let lastTabStop = null;
let modal = null;
let focusOnExit = null;

showPhotoDetails = (data, lastFocusedElement) => {
    focusOnExit = lastFocusedElement;
    modal = document.getElementById('photo-detail-back');
    modal.style.display = "block";
    let modalContentElement = document.getElementById("photo-detail");
    
    const detailPhotoWrapper = document.createElement("div");
    const modalContentImg = document.createElement("img");
    modalContentImg.setAttribute('src', `${data.img_src}`);
    const picDescr = `The photo was made by ${data.rover.name} with ${data.camera.full_name} on ${data.earth_date} (sol ${data.sol})`
    modalContentImg.setAttribute('alt',  picDescr);
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
    modalContentElement.appendChild(btnCloseModal);
    btnCloseModal.addEventListener("click", closeModal);

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
    lastTabStop.focus();

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
    modal.style.display = "none";
    document.getElementById("photo-detail").innerHTML = "";
    focusOnExit.focus();
}



// Register SW
registerSW = () => {
    if (navigator.serviceWorker) {
        navigator.serviceWorker.register('/sw.js').then(function(reg) {
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