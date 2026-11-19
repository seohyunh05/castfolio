
// ======================================
// FIREBASE IMPORTS
// ======================================

import {
    auth
} from "./main.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ======================================
// FIREBASE INITIALIZATION
// ======================================

const db = getFirestore(auth.app);


// ======================================
// ELEMENTS
// ======================================

const galleryGrid =
    document.getElementById("galleryGrid");

const galleryStatus =
    document.getElementById("galleryStatus");

const galleryCount =
    document.getElementById("galleryCount");

const genreButtons =
    document.querySelectorAll(".genre-button");

const imageDialog =
    document.getElementById("imageDialog");

const lightboxImage =
    document.getElementById("lightboxImage");

const lightboxCaption =
    document.getElementById("lightboxCaption");

const lightboxClose =
    document.getElementById("lightboxClose");


// ======================================
// GALLERY STATE
// ======================================

let allImages = [];

let selectedGenre = "all";

let isLoading = true;


// ======================================
// GENRE NAMES
// ======================================

const genreAliases = {
    "sf": "scifi",
    "scifi": "scifi",
    "sciencefiction": "scifi",
    "공상과학": "scifi",

    "fantasy": "fantasy",
    "판타지": "fantasy",

    "history": "history",
    "historical": "history",
    "역사": "history",
    "시대극": "history",

    "romance": "romance",
    "로맨스": "romance",

    "modernfantasy": "modern-fantasy",
    "현대판타지": "modern-fantasy",
    "현판": "modern-fantasy",

    "daily": "daily",
    "dailylife": "daily",
    "sliceoflife": "daily",
    "일상": "daily",

    "mystery": "mystery",
    "미스터리": "mystery",
    "추리": "mystery"
};


// ======================================
// NORMALIZE GENRE
// ======================================

function normalizeGenre(value) {

    if (typeof value !== "string") {
        return null;
    }

    const normalized = value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[\s_-]/g, "");

    return genreAliases[normalized] || null;
}


// ======================================
// GET CHARACTER GENRES
// ======================================

function getCharacterGenres(character) {

    const fields = [
        character.genres,
        character.genre,
        character.category
    ];

    const genres = [];

    fields.forEach(function (field) {

        const values = Array.isArray(field)
            ? field
            : [field];

        values.forEach(function (value) {

            if (typeof value !== "string") {
                return;
            }

            value.split(/[,/|]/).forEach(function (name) {

                const genre = normalizeGenre(name);

                if (genre && !genres.includes(genre)) {
                    genres.push(genre);
                }

            });

        });

    });

    return genres;
}


// ======================================
// GET IMAGE URL
// ======================================

function getImageUrl(value) {

    if (typeof value === "string") {
        return value.trim();
    }

    if (value && typeof value === "object") {

        return (
            value.url ||
            value.downloadURL ||
            value.downloadUrl ||
            value.imageUrl ||
            value.src ||
            ""
        );

    }

    return "";
}


// ======================================
// VALIDATE IMAGE URL
// ======================================

function isValidImageUrl(value) {

    if (typeof value !== "string" || !value) {
        return false;
    }

    try {

        const url = new URL(
            value,
            window.location.href
        );

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {
            return false;
        }

        return (
            /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(value) ||
            /\.(png|jpg|jpeg|webp|gif|avif|svg)(\?.*)?$/i.test(value)
        );

    }

    catch (error) {
        return false;
    }
}


// ======================================
// GET ALL CHARACTER IMAGES
// ======================================

function getCharacterImages(character) {

    const imageFields = [
        character.images,
        character.imageUrls,
        character.galleryImages,
        character.gallery,
        character.photos,
        character.image,
        character.coverImage,
        character.profileImage
    ];

    const imageUrls = [];

    imageFields.forEach(function (field) {

        const images = Array.isArray(field)
            ? field
            : [field];

        images.forEach(function (image) {

            const url = getImageUrl(image);

            if (
                isValidImageUrl(url) &&
                !imageUrls.includes(url)
            ) {
                imageUrls.push(url);
            }

        });

    });

    return imageUrls;
}


// ======================================
// RANDOMIZE IMAGES
// ======================================

function shuffleImages(images) {

    const shuffled = [...images];

    for (
        let index = shuffled.length - 1;
        index > 0;
        index--
    ) {

        const randomIndex = Math.floor(
            Math.random() * (index + 1)
        );

        [
            shuffled[index],
            shuffled[randomIndex]
        ] = [
            shuffled[randomIndex],
            shuffled[index]
        ];

    }

    return shuffled;
}


// ======================================
// OPEN IMAGE VIEWER
// ======================================

function openImageViewer(image) {

    lightboxImage.src = image.url;

    lightboxImage.alt =
        image.characterName + " 이미지";

    lightboxCaption.textContent =
        image.characterName;

    imageDialog.showModal();
}


// ======================================
// CREATE IMAGE CARD
// ======================================

function createImageCard(image) {

    const card = document.createElement("button");

    card.type = "button";
    card.className = "gallery-card";

    card.setAttribute(
        "aria-label",
        image.characterName + " 이미지 크게 보기"
    );


    // Image

    const img = document.createElement("img");

    img.src = image.url;

    img.alt =
        image.characterName + " 이미지";

    img.loading = "lazy";

    img.decoding = "async";


    // Character name

    const caption = document.createElement("span");

    caption.className = "gallery-card-caption";

    caption.textContent =
        image.characterName;


    // Assemble card

    card.appendChild(img);

    card.appendChild(caption);


    // Remove broken images

    img.addEventListener("error", function () {

        card.remove();

    });


    // Open larger image

    card.addEventListener("click", function () {

        openImageViewer(image);

    });

    return card;
}


// ======================================
// RENDER GALLERY
// ======================================

function renderGallery() {

    galleryGrid.replaceChildren();


    // Loading

    if (isLoading) {

        galleryCount.textContent =
            "이미지 불러오는 중...";

        galleryStatus.textContent =
            "갤러리를 불러오는 중입니다...";

        galleryStatus.hidden = false;

        return;
    }


    // Filter images

    const visibleImages = allImages.filter(
        function (image) {

            if (selectedGenre === "all") {
                return true;
            }

            return image.genres.includes(
                selectedGenre
            );

        }
    );


    // Update count

    galleryCount.textContent =
        `이미지 ${visibleImages.length}장`;


    // Empty gallery

    if (visibleImages.length === 0) {

        galleryStatus.textContent =
            allImages.length === 0
                ? "아직 등록된 이미지가 없습니다. 캐릭터에 이미지를 추가해 보세요."
                : "이 장르에 등록된 이미지가 없습니다.";

        galleryStatus.hidden = false;

        return;
    }


    // Show images

    galleryStatus.hidden = true;

    const fragment =
        document.createDocumentFragment();

    visibleImages.forEach(function (image) {

        fragment.appendChild(
            createImageCard(image)
        );

    });

    galleryGrid.appendChild(fragment);
}


// ======================================
// LOAD IMAGES FROM FIRESTORE
// ======================================

async function loadGallery(user) {

    isLoading = true;

    renderGallery();

    try {

        /*
            Expected Firestore structure:

            users
                {userId}
                    characters
                        {characterId}
        */

        const charactersRef = collection(
            db,
            "users",
            user.uid,
            "characters"
        );

        const snapshot = await getDocs(
            charactersRef
        );


        // Prevent showing another user's data

        if (
            !auth.currentUser ||
            auth.currentUser.uid !== user.uid
        ) {
            return;
        }


        const images = [];

        snapshot.forEach(function (documentSnapshot) {

            const character =
                documentSnapshot.data();

            const characterName =
                character.name ||
                character.characterName ||
                character.title ||
                "이름 없는 캐릭터";

            const genres =
                getCharacterGenres(character);

            const characterImages =
                getCharacterImages(character);


            // Each image becomes its own card

            characterImages.forEach(function (url) {

                images.push({
                    url: url,
                    characterName: characterName,
                    genres: genres
                });

            });

        });


        // Shuffle once each time the page loads

        allImages = shuffleImages(images);

        isLoading = false;

        renderGallery();

    }

    catch (error) {

        console.error(
            "Gallery loading failed:",
            error
        );

        isLoading = false;

        allImages = [];

        galleryGrid.replaceChildren();

        galleryCount.textContent =
            "이미지를 불러올 수 없습니다.";

        galleryStatus.textContent =
            "갤러리를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

        galleryStatus.hidden = false;

    }
}


// ======================================
// GENRE FILTER BUTTONS
// ======================================

genreButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        selectedGenre =
            button.dataset.genre;


        // Update active button

        genreButtons.forEach(function (item) {

            const isActive =
                item === button;

            item.classList.toggle(
                "is-active",
                isActive
            );

            item.setAttribute(
                "aria-pressed",
                String(isActive)
            );

        });


        // Update gallery

        renderGallery();

    });

});


// ======================================
// CLOSE IMAGE VIEWER
// ======================================

lightboxClose.addEventListener(
    "click",
    function () {

        imageDialog.close();

    }
);


// Close when clicking outside the image

imageDialog.addEventListener(
    "click",
    function (event) {

        if (event.target === imageDialog) {

            imageDialog.close();

        }

    }
);


// Clear image after closing

imageDialog.addEventListener(
    "close",
    function () {

        lightboxImage.removeAttribute("src");

    }
);


// ======================================
// AUTHENTICATION CHECK
// ======================================

onAuthStateChanged(

    auth,

    function (user) {

        // User is not logged in

        if (!user) {

            window.location.replace(
                "main.html"
            );

            return;
        }


        // User is logged in

        loadGallery(user);

    },

    function (error) {

        console.error(
            "Authentication error:",
            error
        );

        isLoading = false;

        galleryCount.textContent =
            "로그인 상태 확인 실패";

        galleryStatus.textContent =
            "로그인 상태를 확인할 수 없습니다.";

        galleryStatus.hidden = false;

    }

);
