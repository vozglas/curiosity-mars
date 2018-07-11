
const BASE_URL = `https://mars-photos.herokuapp.com/api/v1/`;
document.addEventListener('DOMContentLoaded', event => {
    fillLatestPhotos();
    const datePicker = document.getElementById('input-date-search');
    datePicker.addEventListener('change', event => {
        if (datePicker.value !== "") {
            fillPhotosByEarthDate(datePicker.value);
        } else {
            fillLatestPhotos();
        }

    })
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
        console.log(data.latest_photos);
        return data.latest_photos;
    }).catch(error => {
        console.log(error);
    })
}

fetchPhotosByEarthDate = (date) => {
    return fetch(`${BASE_URL}rovers/curiosity/photos?earth_date=${date}`).then(response => {
        return response.json();
    }).then(data => {
        console.log(data.photos);
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
        img.setAttribute('alt', `Photo made by ${photo.rover.name} with ${photo.camera.full_name} on ${photo.earth_date}`);
        const a = document.createElement('a');
        a.setAttribute('props', JSON.stringify(photo));
        a.href = '/';
        a.addEventListener('click', (event) => {
            event.preventDefault();
            const elem = (event.path[1]);

            const data = JSON.parse(elem.getAttribute('props'));
            const lastFocusedElement = document.activeElement;
            
            showPhotoDetails(data, lastFocusedElement)
            console.log(JSON.parse(elem.getAttribute('props')));
        });
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

    document.getElementById("btn-close-modal").addEventListener("click", closeModal);

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
    const focusableElementsString = 'button, input[text]';
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
    focusOnExit.focus();
}