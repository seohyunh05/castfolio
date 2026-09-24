// ======================================
// FIREBASE IMPORTS
// ======================================
import {
    getApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    getFirestore,
    getDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
    auth
} from "./main.js?v=10";


// ======================================
// FIREBASE
// ======================================
const app =
    getApp();
const db =
    getFirestore(
        app
    );


// ======================================
// CHARACTER ID
// ======================================
const pageParams =
    new URLSearchParams(
        window.location.search
    );
const characterId =
    pageParams.get(
        "id"
    ) || "";


// ======================================
// ELEMENTS
// ======================================
const characterPage =
    document.getElementById(
        "characterPage"
    );
const characterLoading =
    document.getElementById(
        "characterLoading"
    );
const characterError =
    document.getElementById(
        "characterError"
    );
const characterErrorMessage =
    document.getElementById(
        "characterErrorMessage"
    );
const characterContent =
    document.getElementById(
        "characterContent"
    );


// ======================================
// CHARACTER HEADER
// ======================================
const characterName =
    document.getElementById(
        "characterName"
    );
const characterShortDescription =
    document.getElementById(
        "characterShortDescription"
    );
const characterProfileImage =
    document.getElementById(
        "characterProfileImage"
    );


// ======================================
// GENERAL INFORMATION
// ======================================
const characterAge =
    document.getElementById(
        "characterAge"
    );
const characterGender =
    document.getElementById(
        "characterGender"
    );
const characterSpecies =
    document.getElementById(
        "characterSpecies"
    );
const characterHeight =
    document.getElementById(
        "characterHeight"
    );
const characterWeight =
    document.getElementById(
        "characterWeight"
    );
const characterOccupation =
    document.getElementById(
        "characterOccupation"
    );
const characterGenre =
    document.getElementById(
        "characterGenre"
    );
const characterTags =
    document.getElementById(
        "characterTags"
    );


// ======================================
// APPEARANCE
// ======================================
const appearanceHair =
    document.getElementById(
        "appearanceHair"
    );
const appearanceEyes =
    document.getElementById(
        "appearanceEyes"
    );
const appearanceSkin =
    document.getElementById(
        "appearanceSkin"
    );
const appearanceFaceShape =
    document.getElementById(
        "appearanceFaceShape"
    );
const appearanceBodyType =
    document.getElementById(
        "appearanceBodyType"
    );
const appearanceSpecialNotes =
    document.getElementById(
        "appearanceSpecialNotes"
    );
const appearanceOther =
    document.getElementById(
        "appearanceOther"
    );


// ======================================
// LONG INFORMATION
// ======================================
const characterPersonality =
    document.getElementById(
        "characterPersonality"
    );
const characterFeatures =
    document.getElementById(
        "characterFeatures"
    );
const characterRelationship =
    document.getElementById(
        "characterRelationship"
    );
const characterBackground =
    document.getElementById(
        "characterBackground"
    );


// ======================================
// GALLERY
// ======================================
const libraryCharacterName =
    document.getElementById(
        "libraryCharacterName"
    );
const characterGallery =
    document.getElementById(
        "characterGallery"
    );
const galleryEmptyMessage =
    document.getElementById(
        "galleryEmptyMessage"
    );


// ======================================
// ACTION BUTTONS
// ======================================
const editCharacterButton =
    document.getElementById(
        "editCharacterButton"
    );

const deleteCharacterButton =
    document.getElementById(
        "deleteCharacterButton"
    );


// ======================================
// DELETE MODAL
// ======================================
const deleteModal =
    document.getElementById(
        "deleteModal"
    );
const deleteModalBackdrop =
    document.getElementById(
        "deleteModalBackdrop"
    );
const deleteModalClose =
    document.getElementById(
        "deleteModalClose"
    );

const deleteCharacterName =
    document.getElementById(
        "deleteCharacterName"
    );
const cancelDeleteButton =
    document.getElementById(
        "cancelDeleteButton"
    );

const confirmDeleteButton =
    document.getElementById(
        "confirmDeleteButton"
    );


// ======================================
// STATE
// ======================================
let signedInUser =
    null;
let currentCharacter =
    null;
let isDeleting =
    false;


// ======================================
// AUTHENTICATION
// ======================================
onAuthStateChanged(
    auth,
    async function (user) {
        if (!user) {
            alert(
                "캐릭터 페이지는 로그인 후 이용할 수 있습니다."
            );
            window.location.replace(
                "main.html"
            );

            return;
        }

        signedInUser =
            user;
        if (!characterId) {
            showError(
                "캐릭터 ID가 없습니다."
            );

            return;
        }
        await loadCharacter();
    }
);



// ======================================
// LOAD CHARACTER
// ======================================
async function loadCharacter() {
    if (
        !signedInUser ||
        !characterId
    ) {

        return;
    }

    showLoading();

    try {
        const characterRef =
            doc(
                db,
                "users",
                signedInUser.uid,
                "characters",
                characterId
            );

        const snapshot =
            await getDoc(
                characterRef
            );
        if (!snapshot.exists()) {
            showError(
                "해당 캐릭터를 찾을 수 없습니다."
            );

            return;
        }

        const data =
            snapshot.data();
        if (
            data.ownerId &&
            data.ownerId !== signedInUser.uid
        ) {
            showError(
                "이 캐릭터를 볼 권한이 없습니다."
            );

            return;
        }
        currentCharacter = {
            id:
                snapshot.id,

            ...data
        };
        renderCharacter(
            currentCharacter
        );
    }

    catch (error) {
        console.error(
            "Character load failed:",
            error
        );
        showError(
            "캐릭터 정보를 불러오는 중 오류가 발생했습니다."
        );
    }
}



// ======================================
// RENDER CHARACTER
// ======================================
function renderCharacter(
    character
) {
    const general =
        character.general || {};
    const appearance =
        character.appearance || {};
    const displayName =
        character.name ||
        "이름 없음";

    // ==================================
    // TITLE
    // ==================================
    document.title =
        `${displayName} | Castfolio`;

    // ==================================
    // HEADER
    // ==================================
    characterName.textContent =
        displayName;
    characterShortDescription.textContent =
        character.shortDescription ||
        "한줄설명이 없습니다.";

    // ==================================
    // PROFILE IMAGE
    // ==================================
    characterProfileImage.src =
        character.profileImageUrl ||
        "images/castfolio.png";
    characterProfileImage.alt =
        `${displayName} 프로필 이미지`;

    // ==================================
    // GENERAL INFORMATION
    // ==================================
    setText(
        characterAge,
        general.age
    );
    setText(
        characterGender,
        general.gender
    );
    setText(
        characterSpecies,
        general.species
    );
    setText(
        characterHeight,
        general.height
    );
    setText(
        characterWeight,
        general.weight
    );
    setText(
        characterOccupation,
        general.occupation
    );
    setText(
        characterGenre,
        general.genre
    );

    // ==================================
    // TAGS
    // ==================================
    renderTags(
        general.tags
    );

    // ==================================
    // APPEARANCE
    // ==================================
    setText(
        appearanceHair,
        appearance.hair
    );
    setText(
        appearanceEyes,
        appearance.eyes
    );

    setText(
        appearanceSkin,
        appearance.skin
    );
    setText(
        appearanceFaceShape,
        appearance.faceShape
    );
    setText(
        appearanceBodyType,
        appearance.bodyType
    );
    setText(
        appearanceSpecialNotes,
        appearance.specialNotes
    );
    setText(
        appearanceOther,
        appearance.other
    );

    // ==================================
    // OTHER INFORMATION
    // ==================================
    setLongText(
        characterPersonality,
        character.personality
    );
    setLongText(
        characterFeatures,
        character.features
    );
    setLongText(
        characterRelationship,
        character.relationship
    );
    setLongText(
        characterBackground,
        character.background
    );

    // ==================================
    // LIBRARY
    // ==================================
    libraryCharacterName.textContent =
        displayName;
    renderGallery(
        character.galleryImages
    );

    // ==================================
    // BACKGROUND
    // ==================================
    applyGenreBackground(
        general.genre
    );

    // ==================================
    // SHOW CONTENT
    // ==================================
    characterLoading.hidden =
        true;
    characterError.hidden =
        true;
    characterContent.hidden =
        false;
}


// ======================================
// TEXT HELPERS
// ======================================
function setText(
    element,
    value
) {
    if (!element) {
        return;
    }

    element.textContent =
        value &&
        String(value).trim()

            ? String(value).trim()

            : "—";
}

function setLongText(
    element,
    value
) {
    if (!element) {
        return;
    }

    element.textContent =
        value &&
        String(value).trim()
            ? String(value).trim()
            : "등록된 정보가 없습니다.";
}


// ======================================
// TAGS
// ======================================
function renderTags(
    tags
) {
    characterTags.innerHTML =
        "";
    if (
        !Array.isArray(tags) ||
        tags.length === 0
    ) {

        return;
    }

    tags.forEach(
        function (tagText) {
            if (!tagText) {
                return;
            }
            const tag =
                document.createElement(
                    "span"
                );
            tag.className =
                "character-tag";
            tag.textContent =
                `#${tagText}`;
            characterTags.appendChild(
                tag
            );
        }
    );
}


// ======================================
// GALLERY
// ======================================
function renderGallery(
    images
) {
    characterGallery.innerHTML =
        "";

    const validImages =
        Array.isArray(images)
            ? images.filter(
                Boolean
            )
            : [];

    if (
        validImages.length === 0
    ) {
        galleryEmptyMessage.hidden =
            false;


        return;
    }

    galleryEmptyMessage.hidden =
        true;

    validImages.forEach(
        function (
            imageUrl,
            index
        ) {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "character-gallery-item";

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                imageUrl;
            image.alt =
                `${currentCharacter?.name || "캐릭터"} 갤러리 이미지 ${index + 1}`;
            image.loading =
                "lazy";
            image.addEventListener(
                "error",

                function () {

                    image.src =
                        "images/castfolio.png";
                },

                {
                    once:
                        true
                }
            );

            item.appendChild(
                image
            );

            characterGallery.appendChild(
                item
            );
        }
    );
}


// ======================================
// GENRE BACKGROUND
// ======================================
function applyGenreBackground(genre) {
    const normalizedGenre =
        String(genre || "")
            .trim()
            .toLowerCase();

    const genreBackgrounds = [
        {
            keywords: [
                "현대 판타지",
                "현판",
                "modern fantasy"
            ],
            image: "./images/modfan.png"
        },
        {
            keywords: [
                "sf",
                "sci-fi",
                "science fiction",
                "공상과학",
                "사이파이"
            ],
            image: "./images/scifi.png"
        },
        {
            keywords: [
                "판타지",
                "fantasy"
            ],
            image: "./images/fantasy.png"
        },
        {
            keywords: [
                "역사",
                "시대",
                "historical",
                "history"
            ],
            image: "./images/history.png"
        },
        {
            keywords: [
                "로맨스",
                "romance"
            ],
            image: "./images/romance.png"
        },
        {
            keywords: [
                "미스터리",
                "추리",
                "스릴러",
                "mystery",
                "thriller"
            ],
            image: "./images/mystery.png"
        },
        {
            keywords: [
                "일상",
                "daily",
                "slice of life"
            ],
            image: "./images/daily.png"
        }
    ];

    let selectedImage =
        "./images/homepage.png";

    for (const item of genreBackgrounds) {
        const matched =
            item.keywords.some(
                function (keyword) {

                    return normalizedGenre.includes(
                        keyword
                    );
                }
            );
        if (matched) {
            selectedImage =
                item.image;

            break;
        }
    }

    const absoluteImageUrl =
        new URL(
            selectedImage,
            window.location.href
        ).href;
    console.log(
        "Character genre:",
        genre
    );
    console.log(
        "Selected background:",
        selectedImage
    );
    console.log(
        "Absolute background URL:",
        absoluteImageUrl
    );

    characterPage.style.backgroundImage =
        `
        linear-gradient(
            180deg,
            rgba(3, 4, 18, 0.48),
            rgba(5, 7, 22, 0.64) 45%,
            rgba(5, 7, 22, 0.78) 100%
        ),
        url("${absoluteImageUrl}")
        `;
        
    characterPage.style.backgroundPosition =
        "center top, center top";
    characterPage.style.backgroundSize =
        "cover, cover";
    characterPage.style.backgroundRepeat =
        "no-repeat, no-repeat";
    characterPage.style.backgroundAttachment =
        "fixed, fixed";
}


// ======================================
// PROFILE IMAGE FALLBACK
// ======================================
characterProfileImage.addEventListener(
    "error",

    function () {
        if (
            !characterProfileImage.src.includes(
                "castfolio.png"
            )
        ) {
            characterProfileImage.src =
                "images/castfolio.png";
        }
    }
);


// ======================================
// EDIT CHARACTER
// ======================================
editCharacterButton.addEventListener(
    "click",
    
    function () {
        if (!characterId) {
            return;
        }

        window.location.href =
            `add-character.html?edit=${encodeURIComponent(characterId)}`;
    }
);


// ======================================
// OPEN DELETE MODAL
// ======================================
deleteCharacterButton.addEventListener(
    "click",

    function () {
        if (!currentCharacter) {
            return;
        }
        
        deleteCharacterName.textContent =
            currentCharacter.name ||
            "이 캐릭터";
        deleteModal.hidden =
            false;
        document.body.style.overflow =
            "hidden";
    }
);



// ======================================
// CLOSE DELETE MODAL
// ======================================
function closeDeleteModal() {
    if (isDeleting) {
        return;
    }

    deleteModal.hidden =
        true;
    document.body.style.overflow =
        "";
}



// ======================================
// DELETE MODAL EVENTS
// ======================================
deleteModalClose.addEventListener(
    "click",
    closeDeleteModal
);
cancelDeleteButton.addEventListener(
    "click",
    closeDeleteModal
);
deleteModalBackdrop.addEventListener(
    "click",
    closeDeleteModal
);
document.addEventListener(
    "keydown",

    function (event) {
        if (
            event.key === "Escape" &&
            !deleteModal.hidden
        ) {
            closeDeleteModal();
        }
    }
);



// ======================================
// DELETE CHARACTER
// ======================================
confirmDeleteButton.addEventListener(
    "click",

    async function () {
        if (
            !signedInUser ||
            !characterId ||
            isDeleting
        ) {

            return;
        }


        try {
            setDeleteState(
                true
            );

            await deleteDoc(
                doc(
                    db,
                    "users",
                    signedInUser.uid,
                    "characters",
                    characterId
                )
            );

            window.location.replace(
                "my-characters.html"
            );
        }

        catch (error) {
            console.error(
                "Character delete failed:",
                error
            );

            setDeleteState(
                false
            );

            alert(
                "캐릭터를 삭제하지 못했습니다.\n\n" +
                (error.code || "") +
                "\n" +
                error.message
            );
        }
    }
);



// ======================================
// DELETE STATE
// ======================================
function setDeleteState(
    deleting
) {
    isDeleting =
        deleting;
    confirmDeleteButton.disabled =
        deleting;
    cancelDeleteButton.disabled =
        deleting;
    deleteModalClose.disabled =
        deleting;
    confirmDeleteButton.textContent =
        deleting
            ? "삭제 중..."
            : "영구 삭제";
}


// ======================================
// PAGE STATES
// ======================================
function showLoading() {
    characterLoading.hidden =
        false;
    characterError.hidden =
        true;
    characterContent.hidden =
        true;
}

function showError(
    message
) {
    characterLoading.hidden =
        true;
    characterContent.hidden =
        true;
    characterError.hidden =
        false;
    characterErrorMessage.textContent =
        message;
}