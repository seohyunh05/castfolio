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
    collection,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";


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


const storage =
    getStorage(
        app
    );



// ======================================
// ELEMENTS
// ======================================

const characterForm =
    document.getElementById(
        "characterForm"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const saveStatus =
    document.getElementById(
        "saveStatus"
    );


const pageEyebrow =
    document.getElementById(
        "pageEyebrow"
    );


const pageTitle =
    document.getElementById(
        "pageTitle"
    );


const pageDescription =
    document.getElementById(
        "pageDescription"
    );



// ======================================
// PROFILE IMAGE
// ======================================

const profileImageInput =
    document.getElementById(
        "profileImageInput"
    );


const profileImageButton =
    document.getElementById(
        "profileImageButton"
    );


const profilePreview =
    document.getElementById(
        "profilePreview"
    );


const profilePlaceholder =
    document.getElementById(
        "profilePlaceholder"
    );



// ======================================
// CROP MODAL
// ======================================

const cropModal =
    document.getElementById(
        "cropModal"
    );


const cropImage =
    document.getElementById(
        "cropImage"
    );


const cropCloseButton =
    document.getElementById(
        "cropCloseButton"
    );


const cropCancelButton =
    document.getElementById(
        "cropCancelButton"
    );


const cropConfirmButton =
    document.getElementById(
        "cropConfirmButton"
    );



// ======================================
// GALLERY
// ======================================

const galleryInput =
    document.getElementById(
        "galleryInput"
    );


const galleryAddButton =
    document.getElementById(
        "galleryAddButton"
    );


const galleryGrid =
    document.getElementById(
        "galleryGrid"
    );



// ======================================
// SHORT DESCRIPTION
// ======================================

const shortDescription =
    document.getElementById(
        "shortDescription"
    );


const shortDescriptionCount =
    document.getElementById(
        "shortDescriptionCount"
    );



// ======================================
// GENDER
// ======================================

const genderInput =
    document.getElementById(
        "gender"
    );


const genderButtons =
    document.querySelectorAll(
        ".gender-button"
    );



// ======================================
// TABS
// ======================================

const tabButtons =
    document.querySelectorAll(
        ".tab-button"
    );


const tabPanels =
    document.querySelectorAll(
        "[data-tab-panel]"
    );



// ======================================
// PAGE MODE
// ======================================

const pageParams =
    new URLSearchParams(
        window.location.search
    );


/*
    No separate edit-character.html is needed.

    Add mode:
        add-character.html

    Edit mode:
        add-character.html?edit=CHARACTER_ID

    For convenience, ?id=CHARACTER_ID is also accepted.
*/

const editCharacterId =
    pageParams.get("edit") ||
    pageParams.get("id") ||
    "";


const isEditMode =
    Boolean(
        editCharacterId
    );


/*
    Change this one filename only if your
    character detail page uses another name.
*/

const CHARACTER_PAGE_URL =
    "character.html";


// ======================================
// STATE
// ======================================

let signedInUser =
    null;


let existingCharacterData =
    null;


let existingProfileImageUrl =
    "";


let existingProfileOriginalImageUrl =
    "";


let existingProfileCropMetadata =
    null;


let existingGalleryUrls =
    [];


/*
    New original full image selected during
    this visit to the editor.
*/

let profileOriginalFile =
    null;


/*
    New 4:5 cropped profile image.
*/

let profileCroppedFile =
    null;


/*
    Crop coordinates for a newly selected image.
*/

let profileCropMetadata =
    null;


let profilePreviewUrl =
    null;


let cropSourceUrl =
    null;


let cropper =
    null;


let pendingProfileFile =
    null;


/*
    Only newly added gallery files live here.
    Existing Firestore URLs are kept separately.
*/

let galleryFiles =
    [];


// ======================================
// EDIT MODE UI
// ======================================

function configurePageMode() {

    if (!isEditMode) {

        return;

    }


    document.title =
        "캐릭터 수정 | Castfolio";


    if (pageEyebrow) {

        pageEyebrow.textContent =
            "EDIT CHARACTER";

    }


    if (pageTitle) {

        pageTitle.textContent =
            "캐릭터 수정";

    }


    if (pageDescription) {

        pageDescription.textContent =
            "기존 캐릭터의 정보를 수정해 보세요.";

    }

}


configurePageMode();


// ======================================
// FORM HELPERS
// ======================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value ?? "";

}


function updateShortDescriptionCount() {

    if (
        shortDescription &&
        shortDescriptionCount
    ) {

        shortDescriptionCount.textContent =
            `${shortDescription.value.length} / 120`;

    }

}


function applyGenderSelection(
    gender
) {

    setValue(
        "gender",
        gender || ""
    );


    genderButtons.forEach(

        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.gender === gender
            );

        }

    );

}


function setProfilePreviewFromUrl(
    url
) {

    if (!url) {

        profilePreview.removeAttribute(
            "src"
        );


        profilePreview.hidden =
            true;


        profilePlaceholder.hidden =
            false;


        return;

    }


    if (profilePreviewUrl) {

        URL.revokeObjectURL(
            profilePreviewUrl
        );


        profilePreviewUrl =
            null;

    }


    profilePreview.src =
        url;


    profilePreview.hidden =
        false;


    profilePlaceholder.hidden =
        true;


    profileImageButton.textContent =
        "이미지 변경";

}


// ======================================
// LOAD CHARACTER FOR EDIT
// ======================================

async function loadCharacterForEdit() {

    if (
        !isEditMode ||
        !signedInUser
    ) {

        return;

    }


    try {

        setSavingState(
            true,
            "캐릭터 정보를 불러오고 있습니다..."
        );


        const characterRef =
            doc(
                db,
                "users",
                signedInUser.uid,
                "characters",
                editCharacterId
            );


        const snapshot =
            await getDoc(
                characterRef
            );


        if (!snapshot.exists()) {

            alert(
                "수정할 캐릭터를 찾을 수 없습니다."
            );


            window.location.replace(
                "my-characters.html"
            );


            return;

        }


        const data =
            snapshot.data();


        if (
            data.ownerId &&
            data.ownerId !== signedInUser.uid
        ) {

            alert(
                "이 캐릭터를 수정할 권한이 없습니다."
            );


            window.location.replace(
                "my-characters.html"
            );


            return;

        }


        existingCharacterData =
            data;


        setValue(
            "characterName",
            data.name
        );


        setValue(
            "shortDescription",
            data.shortDescription
        );


        const general =
            data.general || {};


        setValue(
            "age",
            general.age
        );


        applyGenderSelection(
            general.gender || ""
        );


        setValue(
            "species",
            general.species
        );


        setValue(
            "height",
            general.height
        );


        setValue(
            "weight",
            general.weight
        );


        setValue(
            "occupation",
            general.occupation
        );


        const loadedTags =
            Array.isArray(
                general.tags
            )
                ? general.tags.join(", ")
                : (general.tags || "");


        setValue(
            "tags",
            loadedTags
        );


        setValue(
            "genre",
            general.genre
        );


        const appearance =
            data.appearance || {};


        setValue(
            "hair",
            appearance.hair
        );


        setValue(
            "eyes",
            appearance.eyes
        );


        setValue(
            "skin",
            appearance.skin
        );


        setValue(
            "faceShape",
            appearance.faceShape
        );


        setValue(
            "bodyType",
            appearance.bodyType
        );


        setValue(
            "personality",
            data.personality
        );


        setValue(
            "features",
            data.features
        );


        setValue(
            "relationship",
            data.relationship
        );


        existingProfileImageUrl =
            data.profileImageUrl || "";


        existingProfileOriginalImageUrl =
            data.profileOriginalImageUrl || "";


        existingProfileCropMetadata =
            data.profileCrop || null;


        existingGalleryUrls =
            Array.isArray(
                data.galleryImages
            )
                ? [...data.galleryImages]
                : [];


        setProfilePreviewFromUrl(
            existingProfileImageUrl
        );


        renderGallery();


        updateShortDescriptionCount();


        setSavingState(
            false,
            ""
        );

    }


    catch (error) {

        console.error(
            "Character load failed:",
            error
        );


        setSavingState(
            false,
            "캐릭터 정보를 불러오지 못했습니다.",
            "error"
        );


        alert(
            "캐릭터 정보를 불러오지 못했습니다.\n\n" +
            (error.code || "") +
            "\n" +
            error.message
        );

    }

}


// ======================================
// LOGIN PROTECTION
// ======================================

onAuthStateChanged(

    auth,

    async function (user) {

        if (!user) {

            alert(
                isEditMode
                    ? "캐릭터 수정은 로그인 후 이용할 수 있습니다."
                    : "캐릭터 추가는 로그인 후 이용할 수 있습니다."
            );


            window.location.replace(
                "main.html"
            );


            return;

        }


        signedInUser =
            user;


        if (isEditMode) {

            await loadCharacterForEdit();

        }

    }

);


// ======================================
// TABS
// ======================================

tabButtons.forEach(

    function (button) {

        button.addEventListener(

            "click",

            function () {

                const targetTab =
                    button.dataset.tab;


                tabButtons.forEach(

                    function (item) {

                        const isActive =
                            item === button;


                        item.classList.toggle(
                            "active",
                            isActive
                        );


                        item.setAttribute(
                            "aria-selected",
                            String(isActive)
                        );

                    }

                );


                tabPanels.forEach(

                    function (panel) {

                        const isActive =
                            panel.dataset.tabPanel ===
                            targetTab;


                        panel.classList.toggle(
                            "active",
                            isActive
                        );


                        panel.hidden =
                            !isActive;

                    }

                );

            }

        );

    }

);



// ======================================
// GENDER
// ======================================

genderButtons.forEach(

    function (button) {

        button.addEventListener(

            "click",

            function () {

                const selectedGender =
                    button.dataset.gender;


                genderInput.value =
                    selectedGender;


                genderButtons.forEach(

                    function (item) {

                        item.classList.toggle(

                            "active",

                            item.dataset.gender ===
                            selectedGender

                        );

                    }

                );

            }

        );

    }

);



// ======================================
// SHORT DESCRIPTION COUNTER
// ======================================

if (
    shortDescription &&
    shortDescriptionCount
) {

    shortDescription.addEventListener(

        "input",

        updateShortDescriptionCount

    );

}


// ======================================
// PROFILE IMAGE BUTTON
// ======================================

profileImageButton.addEventListener(

    "click",

    function () {

        profileImageInput.click();

    }

);



// ======================================
// IMAGE SELECTED
// ======================================

profileImageInput.addEventListener(

    "change",

    function () {

        const file =
            profileImageInput.files[0];


        if (!file) {

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "이미지 파일만 선택할 수 있습니다."
            );


            profileImageInput.value =
                "";


            return;

        }


        /*
            IMPORTANT:

            Do not immediately place the
            original image in the card.

            Open the crop editor first.
        */

        openCropModal(
            file
        );

    }

);



// ======================================
// OPEN CROP EDITOR
// ======================================

function openCropModal(
    file
) {

    /*
        Cropper.js comes from the
        <script> in add-character.html.
    */

    if (
        typeof window.Cropper !==
        "function"
    ) {

        console.error(
            "Cropper.js is not loaded."
        );


        alert(

            "이미지 자르기 기능을 불러오지 못했습니다.\n" +
            "인터넷 연결 또는 Cropper.js 설정을 확인해 주세요."

        );


        profileImageInput.value =
            "";


        return;

    }



    /*
        Clear any previous cropper.
    */

    destroyCropper();

    cleanupCropSourceUrl();



    /*
        Temporarily hold the image.

        It will only become the actual
        character image after the user
        presses 자르기 적용.
    */

    pendingProfileFile =
        file;



    /*
        Create temporary browser URL.
    */

    cropSourceUrl =
        URL.createObjectURL(
            file
        );


    cropImage.src =
        cropSourceUrl;



    /*
        Show modal.
    */

    cropModal.hidden =
        false;


    document.body.classList.add(
        "crop-modal-open"
    );


    cropConfirmButton.disabled =
        true;


    cropConfirmButton.textContent =
        "자르기 적용";



    /*
        Wait until the crop window is
        actually rendered.

        Cropper needs a real width/height.
    */

    window.requestAnimationFrame(

        function () {

            window.requestAnimationFrame(

                function () {

                    cropper =
                        new window.Cropper(

                            cropImage,

                            {

                                /*
                                    IMPORTANT

                                    Profile frame is 4:5.

                                    Therefore crop rectangle
                                    always stays 4:5.
                                */

                                aspectRatio:
                                    4 / 5,


                                /*
                                    Keeps the crop selection
                                    inside the original image.
                                */

                                viewMode:
                                    1,


                                /*
                                    Dragging normally moves
                                    the original image.

                                    The crop box itself can
                                    also be moved separately.
                                */

                                dragMode:
                                    "move",


                                /*
                                    Initial crop rectangle.

                                    0.70 means roughly 70%
                                    of the visible image area.
                                */

                                autoCropArea:
                                    0.70,


                                /*
                                    Responsive resizing.
                                */

                                responsive:
                                    true,


                                restore:
                                    false,


                                checkCrossOrigin:
                                    false,


                                background:
                                    false,


                                /*
                                    Crop guides.
                                */

                                guides:
                                    true,


                                center:
                                    true,


                                highlight:
                                    true,


                                /*
                                    IMPORTANT

                                    User can MOVE the
                                    crop rectangle.
                                */

                                cropBoxMovable:
                                    true,


                                /*
                                    IMPORTANT

                                    User can RESIZE the
                                    crop rectangle.

                                    Aspect ratio remains 4:5.
                                */

                                cropBoxResizable:
                                    true,


                                /*
                                    Original image can also
                                    be moved.
                                */

                                movable:
                                    true,


                                /*
                                    Zoom.
                                */

                                zoomable:
                                    true,


                                zoomOnTouch:
                                    true,


                                zoomOnWheel:
                                    true,


                                wheelZoomRatio:
                                    0.08,


                                /*
                                    Not needed.
                                */

                                scalable:
                                    false,


                                rotatable:
                                    false,


                                toggleDragModeOnDblclick:
                                    false,


                                /*
                                    Cropper is ready.
                                */

                                ready:
                                    function () {

                                        cropConfirmButton.disabled =
                                            false;

                                    }

                            }

                        );

                }

            );

        }

    );

}



// ======================================
// CLOSE CROP EDITOR
// ======================================

function closeCropModal() {

    destroyCropper();


    cleanupCropSourceUrl();


    cropImage.removeAttribute(
        "src"
    );


    cropModal.hidden =
        true;


    document.body.classList.remove(
        "crop-modal-open"
    );


    pendingProfileFile =
        null;


    /*
        Reset input so user can select
        the same file again.
    */

    profileImageInput.value =
        "";


    cropConfirmButton.disabled =
        false;


    cropConfirmButton.textContent =
        "자르기 적용";

}



// ======================================
// DESTROY CROPPER
// ======================================

function destroyCropper() {

    if (cropper) {

        cropper.destroy();


        cropper =
            null;

    }

}



// ======================================
// CLEAN TEMP IMAGE URL
// ======================================

function cleanupCropSourceUrl() {

    if (cropSourceUrl) {

        URL.revokeObjectURL(
            cropSourceUrl
        );


        cropSourceUrl =
            null;

    }

}



// ======================================
// CROP MODAL BUTTONS
// ======================================

cropCloseButton.addEventListener(

    "click",

    closeCropModal

);


cropCancelButton.addEventListener(

    "click",

    closeCropModal

);



// ======================================
// CLICK OUTSIDE MODAL
// ======================================

cropModal.addEventListener(

    "click",

    function (event) {

        if (
            event.target ===
            cropModal
        ) {

            closeCropModal();

        }

    }

);



// ======================================
// ESC TO CLOSE
// ======================================

document.addEventListener(

    "keydown",

    function (event) {

        if (

            event.key ===
            "Escape" &&

            !cropModal.hidden

        ) {

            closeCropModal();

        }

    }

);



// ======================================
// CANVAS -> FILE
// ======================================

function canvasToFile(
    canvas
) {

    return new Promise(

        function (
            resolve,
            reject
        ) {

            canvas.toBlob(

                function (blob) {

                    if (!blob) {

                        reject(

                            new Error(
                                "프로필 이미지를 자르는 데 실패했습니다."
                            )

                        );


                        return;

                    }


                    resolve(

                        new File(

                            [
                                blob
                            ],

                            "profile-cropped.webp",

                            {
                                type:
                                    "image/webp"
                            }

                        )

                    );

                },

                "image/webp",

                0.92

            );

        }

    );

}



// ======================================
// APPLY CROP
// ======================================

cropConfirmButton.addEventListener(

    "click",

    async function () {

        if (
            !cropper ||
            !pendingProfileFile
        ) {

            return;

        }


        try {

            cropConfirmButton.disabled =
                true;


            cropConfirmButton.textContent =
                "처리 중...";



            /*
                Get ONLY the selected
                purple crop rectangle.

                Result is exactly 4:5.
            */

            const croppedCanvas =
                cropper.getCroppedCanvas(

                    {

                        width:
                            1200,


                        height:
                            1500,


                        imageSmoothingEnabled:
                            true,


                        imageSmoothingQuality:
                            "high"

                    }

                );


            if (!croppedCanvas) {

                throw new Error(
                    "자른 이미지를 만들 수 없습니다."
                );

            }



            /*
                Convert crop result into
                a real image file.
            */

            const croppedFile =
                await canvasToFile(
                    croppedCanvas
                );



            /*
                Save crop coordinates.
            */

            const cropData =
                cropper.getData(
                    true
                );


            const imageData =
                cropper.getImageData();



            profileOriginalFile =
                pendingProfileFile;


            profileCroppedFile =
                croppedFile;



            profileCropMetadata = {

                x:
                    cropData.x,


                y:
                    cropData.y,


                width:
                    cropData.width,


                height:
                    cropData.height,


                rotate:
                    cropData.rotate,


                scaleX:
                    cropData.scaleX,


                scaleY:
                    cropData.scaleY,


                aspectRatio:
                    4 / 5,


                originalWidth:
                    imageData.naturalWidth,


                originalHeight:
                    imageData.naturalHeight

            };



            /*
                Show actual cropped
                result in character card.
            */

            setProfilePreview(
                croppedFile
            );


            profileImageButton.textContent =
                "이미지 변경";


            closeCropModal();

        }


        catch (error) {

            console.error(
                "Profile crop failed:",
                error
            );


            alert(

                "이미지 자르기에 실패했습니다.\n\n" +
                error.message

            );


            cropConfirmButton.disabled =
                false;


            cropConfirmButton.textContent =
                "자르기 적용";

        }

    }

);



// ======================================
// PROFILE PREVIEW
// ======================================

function setProfilePreview(
    file
) {

    if (profilePreviewUrl) {

        URL.revokeObjectURL(
            profilePreviewUrl
        );

    }


    profilePreviewUrl =
        URL.createObjectURL(
            file
        );


    profilePreview.src =
        profilePreviewUrl;


    profilePreview.hidden =
        false;


    profilePlaceholder.hidden =
        true;

}



// ======================================
// GALLERY BUTTON
// ======================================

galleryAddButton.addEventListener(

    "click",

    function () {

        galleryInput.click();

    }

);



// ======================================
// GALLERY SELECT
// ======================================

galleryInput.addEventListener(

    "change",

    function () {

        const selectedFiles =
            Array.from(
                galleryInput.files
            )

            .filter(

                function (file) {

                    return file.type.startsWith(
                        "image/"
                    );

                }

            );


        if (
            selectedFiles.length ===
            0
        ) {

            galleryInput.value =
                "";


            return;

        }


        galleryFiles.push(
            ...selectedFiles
        );


        galleryInput.value =
            "";


        renderGallery();

    }

);


// ======================================
// GALLERY CARD
// ======================================

function appendGalleryCard(
    imageSource,
    altText,
    removeHandler,
    isObjectUrl = false
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "gallery-card";


    const img =
        document.createElement(
            "img"
        );


    img.src =
        imageSource;


    img.alt =
        altText;


    if (isObjectUrl) {

        img.onload =
            function () {

                URL.revokeObjectURL(
                    imageSource
                );

            };

    }


    const removeButton =
        document.createElement(
            "button"
        );


    removeButton.type =
        "button";


    removeButton.className =
        "gallery-remove-button";


    removeButton.setAttribute(
        "aria-label",
        "이미지 삭제"
    );


    removeButton.textContent =
        "×";


    removeButton.addEventListener(
        "click",
        removeHandler
    );


    card.appendChild(
        img
    );


    card.appendChild(
        removeButton
    );


    galleryGrid.insertBefore(
        card,
        galleryAddButton
    );

}


// ======================================
// RENDER GALLERY
// ======================================

function renderGallery() {

    galleryGrid

        .querySelectorAll(
            ".gallery-card"
        )

        .forEach(

            function (card) {

                card.remove();

            }

        );


    existingGalleryUrls.forEach(

        function (
            url,
            index
        ) {

            appendGalleryCard(
                url,
                `기존 갤러리 이미지 ${index + 1}`,

                function () {

                    existingGalleryUrls.splice(
                        index,
                        1
                    );


                    renderGallery();

                }
            );

        }

    );


    galleryFiles.forEach(

        function (
            file,
            index
        ) {

            const objectUrl =
                URL.createObjectURL(
                    file
                );


            appendGalleryCard(
                objectUrl,
                `새 갤러리 이미지 ${index + 1}`,

                function () {

                    galleryFiles.splice(
                        index,
                        1
                    );


                    renderGallery();

                },

                true
            );

        }

    );

}


// ======================================
// CLEAN FORM VALUE
// ======================================

function cleanValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value.trim()
        : "";

}



// ======================================
// TAGS
// ======================================

function makeTagArray(
    tagString
) {

    const normalized =
        tagString

            .split(",")

            .map(

                function (tag) {

                    return tag.trim();

                }

            )

            .filter(
                Boolean
            );


    return [

        ...new Set(
            normalized
        )

    ];

}



// ======================================
// FILE NAME
// ======================================

function sanitizeFileName(
    fileName
) {

    return fileName.replace(

        /[^a-zA-Z0-9가-힣._-]/g,

        "_"

    );

}



function makeStorageFileName(
    file,
    index = 0
) {

    const time =
        Date.now();


    return (

        `${time}_${index}_` +

        sanitizeFileName(
            file.name
        )

    );

}



// ======================================
// FIREBASE STORAGE UPLOAD
// ======================================

async function uploadFile(
    file,
    storagePath
) {

    const storageRef =
        ref(
            storage,
            storagePath
        );


    await uploadBytes(
        storageRef,
        file
    );


    return getDownloadURL(
        storageRef
    );

}



// ======================================
// SAVE BUTTON STATE
// ======================================

function setSavingState(

    isSaving,

    message = "",

    type = ""

) {

    saveButton.disabled =
        isSaving;


    saveButton

        .querySelector(
            ".save-button-text"
        )

        .textContent =

        isSaving
            ? "저장 중..."
            : (
                isEditMode
                    ? "수정 저장"
                    : "저장"
            );


    saveStatus.textContent =
        message;


    saveStatus.classList.remove(
        "error",
        "success"
    );


    if (type) {

        saveStatus.classList.add(
            type
        );

    }

}


// ======================================
// CHARACTER DATA
// ======================================

function makeCharacterData() {

    return {

        ownerId:
            signedInUser.uid,


        ownerName:
            signedInUser.displayName ||
            signedInUser.email ||
            "사용자",


        name:
            cleanValue(
                "characterName"
            ),


        shortDescription:
            cleanValue(
                "shortDescription"
            ),


        general: {

            age:
                cleanValue(
                    "age"
                ),


            gender:
                cleanValue(
                    "gender"
                ),


            species:
                cleanValue(
                    "species"
                ),


            height:
                cleanValue(
                    "height"
                ),


            weight:
                cleanValue(
                    "weight"
                ),


            occupation:
                cleanValue(
                    "occupation"
                ),


            tags:
                makeTagArray(
                    cleanValue(
                        "tags"
                    )
                ),


            genre:
                cleanValue(
                    "genre"
                )

        },


        appearance: {

            hair:
                cleanValue(
                    "hair"
                ),


            eyes:
                cleanValue(
                    "eyes"
                ),


            skin:
                cleanValue(
                    "skin"
                ),


            faceShape:
                cleanValue(
                    "faceShape"
                ),


            bodyType:
                cleanValue(
                    "bodyType"
                )

        },


        personality:
            cleanValue(
                "personality"
            ),


        features:
            cleanValue(
                "features"
            ),


        relationship:
            cleanValue(
                "relationship"
            )

    };

}


// ======================================
// EDIT SUCCESS URL
// ======================================

function getCharacterPageUrl(
    characterId
) {

    const customReturn =
        pageParams.get(
            "return"
        );


    if (customReturn) {

        return customReturn;

    }


    return (
        `${CHARACTER_PAGE_URL}?id=` +
        encodeURIComponent(
            characterId
        )
    );

}


// ======================================
// SAVE CHARACTER
// ======================================

characterForm.addEventListener(

    "submit",

    async function (event) {

        event.preventDefault();


        if (!signedInUser) {

            setSavingState(
                false,
                "로그인 정보를 확인할 수 없습니다.",
                "error"
            );


            return;

        }


        const characterData =
            makeCharacterData();


        try {

            setSavingState(
                true,
                isEditMode
                    ? "수정된 정보를 저장하고 있습니다..."
                    : "캐릭터 정보를 저장하고 있습니다..."
            );


            let characterId =
                editCharacterId;


            let characterRef =
                null;


            // ==================================
            // ADD MODE: CREATE DOCUMENT FIRST
            // ==================================

            if (!isEditMode) {

                const characterCollection =
                    collection(
                        db,
                        "users",
                        signedInUser.uid,
                        "characters"
                    );


                const characterDoc =
                    await addDoc(

                        characterCollection,

                        {
                            ...characterData,

                            profileImageUrl:
                                "",

                            profileOriginalImageUrl:
                                "",

                            profileCrop:
                                null,

                            galleryImages:
                                [],

                            createdAt:
                                serverTimestamp(),

                            updatedAt:
                                serverTimestamp()
                        }

                    );


                characterId =
                    characterDoc.id;

            }


            characterRef =
                doc(
                    db,
                    "users",
                    signedInUser.uid,
                    "characters",
                    characterId
                );


            // ==================================
            // PROFILE IMAGE
            // ==================================

            let profileImageUrl =
                existingProfileImageUrl;


            let profileOriginalImageUrl =
                existingProfileOriginalImageUrl;


            let finalProfileCrop =
                existingProfileCropMetadata;


            if (
                profileOriginalFile &&
                profileCroppedFile
            ) {

                const originalFileName =
                    makeStorageFileName(
                        profileOriginalFile
                    );


                profileOriginalImageUrl =
                    await uploadFile(
                        profileOriginalFile,
                        `users/${signedInUser.uid}/` +
                        `characters/${characterId}/` +
                        `profile/original/${originalFileName}`
                    );


                profileImageUrl =
                    await uploadFile(
                        profileCroppedFile,
                        `users/${signedInUser.uid}/` +
                        `characters/${characterId}/` +
                        `profile/cropped/profile-cropped.webp`
                    );


                finalProfileCrop =
                    profileCropMetadata;

            }


            // ==================================
            // GALLERY IMAGES
            // ==================================

            const galleryImageUrls =
                [
                    ...existingGalleryUrls
                ];


            for (
                let i = 0;
                i < galleryFiles.length;
                i += 1
            ) {

                const file =
                    galleryFiles[i];


                const galleryFileName =
                    makeStorageFileName(
                        file,
                        i
                    );


                const imageUrl =
                    await uploadFile(
                        file,
                        `users/${signedInUser.uid}/` +
                        `characters/${characterId}/` +
                        `gallery/${galleryFileName}`
                    );


                galleryImageUrls.push(
                    imageUrl
                );

            }


            // ==================================
            // SAVE FINAL DATA
            // ==================================

            await updateDoc(

                characterRef,

                {
                    ...characterData,

                    profileImageUrl:
                        profileImageUrl,

                    profileOriginalImageUrl:
                        profileOriginalImageUrl,

                    profileCrop:
                        finalProfileCrop,

                    galleryImages:
                        galleryImageUrls,

                    updatedAt:
                        serverTimestamp()
                }

            );


            setSavingState(
                false,
                isEditMode
                    ? "수정되었습니다."
                    : "저장되었습니다.",
                "success"
            );


            window.setTimeout(

                function () {

                    if (isEditMode) {

                        window.location.href =
                            getCharacterPageUrl(
                                characterId
                            );

                    }

                    else {

                        window.location.href =
                            "my-characters.html";

                    }

                },

                500

            );

        }


        catch (error) {

            console.error(
                isEditMode
                    ? "Character update failed:"
                    : "Character save failed:",
                error
            );


            setSavingState(
                false,
                isEditMode
                    ? "수정 저장에 실패했습니다. Firebase 설정과 권한을 확인해 주세요."
                    : "저장에 실패했습니다. Firebase 설정과 권한을 확인해 주세요.",
                "error"
            );


            alert(
                (
                    isEditMode
                        ? "캐릭터 수정 저장에 실패했습니다.\n\n"
                        : "캐릭터 저장에 실패했습니다.\n\n"
                ) +
                (error.code || "") +
                "\n" +
                error.message
            );

        }

    }

);


// ======================================
// CLEAN UP
// ======================================

window.addEventListener(

    "beforeunload",

    function () {

        destroyCropper();


        cleanupCropSourceUrl();


        if (profilePreviewUrl) {

            URL.revokeObjectURL(
                profilePreviewUrl
            );

        }

    }

);