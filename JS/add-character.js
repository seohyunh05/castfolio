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
    auth
} from "./main.js?v=10";


// ======================================
// FIREBASE
// ======================================

const app = getApp();
const db = getFirestore(app);


// ======================================
// CLOUDINARY
// ======================================
//
// IMPORTANT:
//
// 1. Create a FREE Cloudinary account.
// 2. Create an UNSIGNED upload preset.
// 3. Replace the two values below.
//
// DO NOT put your Cloudinary API Secret here.
//

const CLOUDINARY_CLOUD_NAME = "comnds5w";
const CLOUDINARY_UPLOAD_PRESET = "character_uploads";


// ======================================
// IMAGE OPTIMIZATION
// ======================================

const GALLERY_MAX_DIMENSION = 1800;
const GALLERY_WEBP_QUALITY = 0.84;


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

const editCharacterId =
    pageParams.get("edit") ||
    pageParams.get("id") ||
    "";

const isEditMode =
    Boolean(
        editCharacterId
    );


// ======================================
// STATE
// ======================================

let signedInUser = null;

let existingProfileImageUrl = "";

let existingProfileCropMetadata = null;

let existingGalleryUrls = [];

let profileOriginalFile = null;

let profileCroppedFile = null;

let profileCropMetadata = null;

let profilePreviewUrl = null;

let cropSourceUrl = null;

let cropper = null;

let pendingProfileFile = null;

let galleryFiles = [];


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


// ======================================
// PROFILE PREVIEW
// ======================================

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
                : (
                    general.tags || ""
                );

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
            "specialNotes",
            appearance.specialNotes
        );

        setValue(
            "appearanceOther",
            appearance.other
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
// SHORT DESCRIPTION
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
// PROFILE IMAGE SELECT
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

        openCropModal(
            file
        );
    }
);


// ======================================
// OPEN CROP MODAL
// ======================================

function openCropModal(
    file
) {

    if (
        typeof window.Cropper !==
        "function"
    ) {

        alert(
            "이미지 자르기 기능을 불러오지 못했습니다."
        );

        profileImageInput.value =
            "";

        return;
    }

    destroyCropper();

    cleanupCropSourceUrl();

    pendingProfileFile =
        file;

    cropSourceUrl =
        URL.createObjectURL(
            file
        );

    cropImage.src =
        cropSourceUrl;

    cropModal.hidden =
        false;

    document.body.classList.add(
        "crop-modal-open"
    );

    cropConfirmButton.disabled =
        true;

    cropConfirmButton.textContent =
        "자르기 적용";

    window.requestAnimationFrame(
        function () {

            window.requestAnimationFrame(
                function () {

                    cropper =
                        new window.Cropper(
                            cropImage,

                            {
                                aspectRatio: 4 / 5,

                                viewMode: 1,

                                dragMode: "move",

                                autoCropArea: 0.70,

                                responsive: true,

                                restore: false,

                                checkCrossOrigin: false,

                                background: false,

                                guides: true,

                                center: true,

                                highlight: true,

                                cropBoxMovable: true,

                                cropBoxResizable: true,

                                movable: true,

                                zoomable: true,

                                zoomOnTouch: true,

                                zoomOnWheel: true,

                                wheelZoomRatio: 0.08,

                                scalable: false,

                                rotatable: false,

                                toggleDragModeOnDblclick:
                                    false,

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
// CLOSE CROP MODAL
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

    profileImageInput.value =
        "";

    cropConfirmButton.disabled =
        false;

    cropConfirmButton.textContent =
        "자르기 적용";
}


function destroyCropper() {

    if (cropper) {

        cropper.destroy();

        cropper =
            null;
    }
}


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
// CROP MODAL EVENTS
// ======================================

cropCloseButton.addEventListener(
    "click",
    closeCropModal
);

cropCancelButton.addEventListener(
    "click",
    closeCropModal
);

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

document.addEventListener(
    "keydown",

    function (event) {

        if (
            event.key === "Escape" &&
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
                            [blob],

                            "profile-cropped.webp",

                            {
                                type:
                                    "image/webp"
                            }
                        )
                    );
                },

                "image/webp",

                0.88
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

            const croppedCanvas =
                cropper.getCroppedCanvas(
                    {
                        width: 1000,

                        height: 1250,

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

            const croppedFile =
                await canvasToFile(
                    croppedCanvas
                );

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
                    cropData.x ?? 0,

                y:
                    cropData.y ?? 0,

                width:
                    cropData.width ?? 0,

                height:
                    cropData.height ?? 0,

                rotate:
                    cropData.rotate ?? 0,

                scaleX:
                    cropData.scaleX ?? 1,

                scaleY:
                    cropData.scaleY ?? 1,

                aspectRatio:
                    4 / 5,

                originalWidth:
                    imageData.naturalWidth ?? 0,

                originalHeight:
                    imageData.naturalHeight ?? 0
            };

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
// GALLERY BUTTON
// ======================================

galleryAddButton.addEventListener(
    "click",

    function () {

        galleryInput.click();
    }
);


// ======================================
// GALLERY IMAGE OPTIMIZATION
// ======================================

function loadImageElement(
    objectUrl
) {

    return new Promise(
        function (
            resolve,
            reject
        ) {

            const image =
                new Image();

            image.onload =
                function () {

                    resolve(
                        image
                    );
                };

            image.onerror =
                function () {

                    reject(
                        new Error(
                            "이미지를 불러올 수 없습니다."
                        )
                    );
                };

            image.src =
                objectUrl;
        }
    );
}


async function optimizeGalleryImage(
    file
) {

    if (
        !file ||
        !file.type.startsWith(
            "image/"
        )
    ) {

        return file;
    }

    /*
        Keep animated GIF and SVG files as-is.
        Converting them through canvas can remove
        animation or vector information.
    */

    if (
        file.type === "image/gif" ||
        file.type === "image/svg+xml"
    ) {

        return file;
    }

    let bitmap =
        null;

    let image =
        null;

    let objectUrl =
        null;

    try {

        let sourceWidth;
        let sourceHeight;
        let drawable;

        if (
            typeof createImageBitmap ===
            "function"
        ) {

            bitmap =
                await createImageBitmap(
                    file
                );

            sourceWidth =
                bitmap.width;

            sourceHeight =
                bitmap.height;

            drawable =
                bitmap;
        }

        else {

            objectUrl =
                URL.createObjectURL(
                    file
                );

            image =
                await loadImageElement(
                    objectUrl
                );

            sourceWidth =
                image.naturalWidth;

            sourceHeight =
                image.naturalHeight;

            drawable =
                image;
        }

        if (
            !sourceWidth ||
            !sourceHeight
        ) {

            return file;
        }

        const longestSide =
            Math.max(
                sourceWidth,
                sourceHeight
            );

        const scale =
            Math.min(
                1,
                GALLERY_MAX_DIMENSION /
                longestSide
            );

        const targetWidth =
            Math.max(
                1,
                Math.round(
                    sourceWidth * scale
                )
            );

        const targetHeight =
            Math.max(
                1,
                Math.round(
                    sourceHeight * scale
                )
            );

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            targetWidth;

        canvas.height =
            targetHeight;

        const context =
            canvas.getContext(
                "2d"
            );

        if (!context) {

            return file;
        }

        context.imageSmoothingEnabled =
            true;

        context.imageSmoothingQuality =
            "high";

        context.drawImage(
            drawable,
            0,
            0,
            targetWidth,
            targetHeight
        );

        const blob =
            await new Promise(
                function (resolve) {

                    canvas.toBlob(
                        resolve,
                        "image/webp",
                        GALLERY_WEBP_QUALITY
                    );
                }
            );

        if (!blob) {

            return file;
        }

        /*
            If WebP somehow becomes larger than the
            original file, keep the original instead.
        */

        if (
            blob.size >=
            file.size
        ) {

            return file;
        }

        const fileBaseName =
            file.name
                .replace(
                    /\.[^/.]+$/,
                    ""
                ) ||
            "gallery-image";

        return new File(
            [blob],
            `${fileBaseName}.webp`,
            {
                type:
                    "image/webp",

                lastModified:
                    file.lastModified ||
                    Date.now()
            }
        );
    }

    catch (error) {

        console.warn(
            "Gallery image optimization failed; using original file:",
            error
        );

        return file;
    }

    finally {

        if (
            bitmap &&
            typeof bitmap.close ===
            "function"
        ) {

            bitmap.close();
        }

        if (objectUrl) {

            URL.revokeObjectURL(
                objectUrl
            );
        }
    }
}


// ======================================
// GALLERY SELECT
// ======================================

galleryInput.addEventListener(
    "change",

    async function () {

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

        galleryInput.value =
            "";

        if (
            selectedFiles.length === 0
        ) {

            return;
        }

        galleryAddButton.disabled =
            true;

        galleryAddButton.setAttribute(
            "aria-busy",
            "true"
        );

        try {

            const optimizedFiles =
                await Promise.all(

                    selectedFiles.map(
                        function (file) {

                            return optimizeGalleryImage(
                                file
                            );
                        }
                    )

                );

            galleryFiles.push(
                ...optimizedFiles
            );

            renderGallery();
        }

        finally {

            galleryAddButton.disabled =
                false;

            galleryAddButton.removeAttribute(
                "aria-busy"
            );
        }
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
// CLOUDINARY CONFIG CHECK
// ======================================

function checkCloudinaryConfig() {

    if (
        !CLOUDINARY_CLOUD_NAME ||
        CLOUDINARY_CLOUD_NAME ===
        "YOUR_CLOUD_NAME" ||
        !CLOUDINARY_UPLOAD_PRESET ||
        CLOUDINARY_UPLOAD_PRESET ===
        "YOUR_UNSIGNED_UPLOAD_PRESET"
    ) {

        throw new Error(
            "Cloudinary 설정이 필요합니다. " +
            "add-character.js 위쪽의 " +
            "CLOUDINARY_CLOUD_NAME과 " +
            "CLOUDINARY_UPLOAD_PRESET을 입력해 주세요."
        );
    }
}


// ======================================
// CLOUDINARY UPLOAD
// ======================================

async function uploadImage(
    file,
    folder
) {

    checkCloudinaryConfig();

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    /*
        This only organizes images.

        Example:

        castfolio/
            USER_UID/
                CHARACTER_ID/
                    profile/
                    gallery/
    */

    formData.append(
        "folder",
        folder
    );

    const uploadUrl =
        `https://api.cloudinary.com/v1_1/` +
        `${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const response =
        await fetch(
            uploadUrl,

            {
                method:
                    "POST",

                body:
                    formData
            }
        );

    let result;

    try {

        result =
            await response.json();
    }

    catch {

        throw new Error(
            "이미지 업로드 서버의 응답을 읽을 수 없습니다."
        );
    }

    if (!response.ok) {

        throw new Error(
            result?.error?.message ||
            "이미지 업로드에 실패했습니다."
        );
    }

    if (!result.secure_url) {

        throw new Error(
            "업로드된 이미지 URL을 받지 못했습니다."
        );
    }

    return {

        url:
            result.secure_url,

        publicId:
            result.public_id || ""
    };
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

    const buttonText =
        saveButton.querySelector(
            ".save-button-text"
        );

    if (buttonText) {

        buttonText.textContent =
            isSaving
                ? "저장 중..."
                : (
                    isEditMode
                        ? "수정 저장"
                        : "저장"
                );
    }

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
                ),
            
            specialNotes:
                cleanValue(
                    "specialNotes"
                ),

            other:
                cleanValue(
                    "appearanceOther"
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
            // CREATE NEW FIRESTORE DOCUMENT
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

                            profileImagePublicId:
                                "",

                            profileCrop:
                                null,

                            galleryImages:
                                [],

                            galleryImagePublicIds:
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
            // PREPARE IMAGE UPLOADS
            // ==================================

            let profileImageUrl =
                existingProfileImageUrl;

            let profileImagePublicId =
                "";

            let finalProfileCrop =
                existingProfileCropMetadata;

            const galleryImageUrls =
                [
                    ...existingGalleryUrls
                ];

            const galleryImagePublicIds =
                [];

            const totalUploads =
                (
                    profileCroppedFile
                        ? 1
                        : 0
                ) +
                galleryFiles.length;

            let finishedUploads =
                0;

            function updateUploadProgress() {

                if (
                    totalUploads === 0
                ) {

                    return;
                }

                setSavingState(
                    true,
                    `이미지를 업로드하고 있습니다... ` +
                    `(${finishedUploads}/${totalUploads})`
                );
            }

            async function uploadAndTrack(
                file,
                folder
            ) {

                const result =
                    await uploadImage(
                        file,
                        folder
                    );

                finishedUploads +=
                    1;

                updateUploadProgress();

                return result;
            }

            if (
                totalUploads > 0
            ) {

                updateUploadProgress();
            }

            // ==================================
            // PROFILE + GALLERY IN PARALLEL
            // ==================================

            const profileUploadPromise =
                profileCroppedFile

                    ? uploadAndTrack(
                        profileCroppedFile,

                        `castfolio/` +
                        `${signedInUser.uid}/` +
                        `${characterId}/profile`
                    )

                    : Promise.resolve(
                        null
                    );

            const galleryUploadPromise =
                Promise.all(

                    galleryFiles.map(
                        function (file) {

                            return uploadAndTrack(
                                file,

                                `castfolio/` +
                                `${signedInUser.uid}/` +
                                `${characterId}/gallery`
                            );
                        }
                    )

                );

            const [
                profileUpload,
                galleryUploads
            ] =
                await Promise.all(
                    [
                        profileUploadPromise,
                        galleryUploadPromise
                    ]
                );

            // ==================================
            // PROFILE RESULT
            // ==================================

            if (profileUpload) {

                profileImageUrl =
                    profileUpload.url;

                profileImagePublicId =
                    profileUpload.publicId;

                finalProfileCrop =
                    profileCropMetadata;
            }

            // ==================================
            // GALLERY RESULTS
            // ==================================

            galleryUploads.forEach(
                function (upload) {

                    galleryImageUrls.push(
                        upload.url
                    );

                    galleryImagePublicIds.push(
                        upload.publicId
                    );
                }
            );

            // ==================================
            // SAVE FINAL FIRESTORE DATA
            // ==================================

            setSavingState(
                true,
                "캐릭터 정보를 저장하고 있습니다..."
            );

            await updateDoc(
                characterRef,

                {
                    ...characterData,

                    profileImageUrl:
                        profileImageUrl,

                    profileImagePublicId:
                        profileImagePublicId,

                    /*
                        Kept for compatibility with
                        older versions of Castfolio.

                        The original uncropped image is
                        NOT uploaded anymore because
                        that would use twice the image
                        storage for every profile image.
                    */

                    profileOriginalImageUrl:
                        "",

                    profileCrop:
                        finalProfileCrop
                            ? {
                                x: finalProfileCrop.x ?? 0,
                                y: finalProfileCrop.y ?? 0,
                                width: finalProfileCrop.width ?? 0,
                                height: finalProfileCrop.height ?? 0,
                                rotate: finalProfileCrop.rotate ?? 0,
                                scaleX: finalProfileCrop.scaleX ?? 1,
                                scaleY: finalProfileCrop.scaleY ?? 1,
                                aspectRatio: finalProfileCrop.aspectRatio ?? (4 / 5),
                                originalWidth: finalProfileCrop.originalWidth ?? 0,
                                originalHeight: finalProfileCrop.originalHeight ?? 0
                            }
                            : null,

                    galleryImages:
                        galleryImageUrls,

                    galleryImagePublicIds:
                        galleryImagePublicIds,

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

                    window.location.href =
                        "my-characters.html";
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
                    ? "수정 저장에 실패했습니다."
                    : "저장에 실패했습니다.",

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
// CLEANUP
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