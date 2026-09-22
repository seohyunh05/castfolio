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
    doc
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

const app = getApp();
const db = getFirestore(app);
const storage = getStorage(app);


// ======================================
// ELEMENTS
// ======================================

const characterForm = document.getElementById("characterForm");
const saveButton = document.getElementById("saveButton");
const saveStatus = document.getElementById("saveStatus");

// Profile image
const profileImageInput = document.getElementById("profileImageInput");
const profileImageButton = document.getElementById("profileImageButton");
const profilePreview = document.getElementById("profilePreview");
const profilePlaceholder = document.getElementById("profilePlaceholder");

// Crop modal
const cropModal = document.getElementById("cropModal");
const cropViewport = document.getElementById("cropViewport");
const cropImage = document.getElementById("cropImage");
const cropZoom = document.getElementById("cropZoom");
const cropZoomValue = document.getElementById("cropZoomValue");
const cropCloseButton = document.getElementById("cropCloseButton");
const cropCancelButton = document.getElementById("cropCancelButton");
const cropConfirmButton = document.getElementById("cropConfirmButton");

// Gallery
const galleryInput = document.getElementById("galleryInput");
const galleryAddButton = document.getElementById("galleryAddButton");
const galleryGrid = document.getElementById("galleryGrid");

// Short description
const shortDescription = document.getElementById("shortDescription");
const shortDescriptionCount = document.getElementById("shortDescriptionCount");

// Gender
const genderInput = document.getElementById("gender");
const genderButtons = document.querySelectorAll(".gender-button");

// Tabs
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll("[data-tab-panel]");


// ======================================
// STATE
// ======================================

let signedInUser = null;

// The original file is kept so Edit Character can use it later.
let profileOriginalFile = null;

// This is the 4:5 image produced by the crop modal.
let profileCroppedFile = null;

// Crop values can also be stored for a future edit page.
let profileCropMetadata = null;

let profilePreviewUrl = null;
let galleryFiles = [];

const cropState = {
    sourceFile: null,
    sourceUrl: null,

    zoom: 1,
    offsetX: 0,
    offsetY: 0,

    baseWidth: 0,
    baseHeight: 0,
    frameWidth: 0,
    frameHeight: 0,

    dragging: false,
    pointerId: null,
    startPointerX: 0,
    startPointerY: 0,
    startOffsetX: 0,
    startOffsetY: 0
};


// ======================================
// LOGIN PROTECTION
// ======================================

onAuthStateChanged(auth, function (user) {
    if (!user) {
        alert("캐릭터 추가는 로그인 후 이용할 수 있습니다.");
        window.location.replace("main.html");
        return;
    }

    signedInUser = user;
});


// ======================================
// TABS
// ======================================

tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const targetTab = button.dataset.tab;

        tabButtons.forEach(function (item) {
            const isActive = item === button;

            item.classList.toggle("active", isActive);
            item.setAttribute("aria-selected", String(isActive));
        });

        tabPanels.forEach(function (panel) {
            const isActive = panel.dataset.tabPanel === targetTab;

            panel.classList.toggle("active", isActive);
            panel.hidden = !isActive;
        });
    });
});


// ======================================
// GENDER BUTTONS
// ======================================

genderButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const selectedGender = button.dataset.gender;

        genderInput.value = selectedGender;

        genderButtons.forEach(function (item) {
            item.classList.toggle(
                "active",
                item.dataset.gender === selectedGender
            );
        });
    });
});


// ======================================
// SHORT DESCRIPTION COUNT
// ======================================

shortDescription.addEventListener("input", function () {
    shortDescriptionCount.textContent =
        `${shortDescription.value.length} / 120`;
});


// ======================================
// PROFILE IMAGE SELECTION
// ======================================

profileImageButton.addEventListener("click", function () {
    profileImageInput.click();
});

profileImageInput.addEventListener("change", function () {
    const file = profileImageInput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택할 수 있습니다.");
        profileImageInput.value = "";
        return;
    }

    // Selecting an image immediately opens the crop screen.
    openCropModal(file);
});


// ======================================
// OPEN CROP MODAL
// ======================================

function openCropModal(file) {
    cleanupCropSource();

    cropState.sourceFile = file;
    cropState.zoom = 1;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    cropState.baseWidth = 0;
    cropState.baseHeight = 0;
    cropState.frameWidth = 0;
    cropState.frameHeight = 0;

    cropZoom.value = "1";
    cropZoomValue.textContent = "100%";

    cropConfirmButton.disabled = true;
    cropConfirmButton.textContent = "자르기";

    cropModal.hidden = false;
    document.body.classList.add("crop-modal-open");

    cropState.sourceUrl = URL.createObjectURL(file);

    cropImage.onload = function () {
        calculateCropBaseSize(true);
        cropConfirmButton.disabled = false;
        cropConfirmButton.focus();
    };

    cropImage.onerror = function () {
        alert("이미지를 불러올 수 없습니다.");
        closeCropModal();
    };

    cropImage.src = cropState.sourceUrl;
}


// ======================================
// CLOSE CROP MODAL
// ======================================

function closeCropModal() {
    stopCropDragging();

    cropModal.hidden = true;
    document.body.classList.remove("crop-modal-open");

    cropImage.onload = null;
    cropImage.onerror = null;
    cropImage.removeAttribute("src");

    cleanupCropSource();

    cropState.sourceFile = null;
    cropState.baseWidth = 0;
    cropState.baseHeight = 0;
    cropState.frameWidth = 0;
    cropState.frameHeight = 0;

    // Allows choosing the same image again.
    profileImageInput.value = "";
}

function cleanupCropSource() {
    if (cropState.sourceUrl) {
        URL.revokeObjectURL(cropState.sourceUrl);
        cropState.sourceUrl = null;
    }
}

cropCloseButton.addEventListener("click", closeCropModal);
cropCancelButton.addEventListener("click", closeCropModal);

cropModal.addEventListener("click", function (event) {
    // Clicking the dark area outside the card works like Cancel.
    if (event.target === cropModal) {
        closeCropModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        !cropModal.hidden
    ) {
        closeCropModal();
    }
});


// ======================================
// CROP LAYOUT
// ======================================

function calculateCropBaseSize(resetPosition = false) {
    if (
        !cropImage.naturalWidth ||
        !cropImage.naturalHeight ||
        cropModal.hidden
    ) {
        return;
    }

    const newFrameWidth = cropViewport.clientWidth;
    const newFrameHeight = cropViewport.clientHeight;

    if (!newFrameWidth || !newFrameHeight) {
        return;
    }

    const oldFrameWidth = cropState.frameWidth;
    const oldFrameHeight = cropState.frameHeight;

    // Preserve the same relative crop if the browser size changes.
    if (
        !resetPosition &&
        oldFrameWidth > 0 &&
        oldFrameHeight > 0
    ) {
        cropState.offsetX *= newFrameWidth / oldFrameWidth;
        cropState.offsetY *= newFrameHeight / oldFrameHeight;
    }

    const coverScale = Math.max(
        newFrameWidth / cropImage.naturalWidth,
        newFrameHeight / cropImage.naturalHeight
    );

    cropState.baseWidth =
        cropImage.naturalWidth * coverScale;

    cropState.baseHeight =
        cropImage.naturalHeight * coverScale;

    cropState.frameWidth = newFrameWidth;
    cropState.frameHeight = newFrameHeight;

    if (resetPosition) {
        cropState.offsetX = 0;
        cropState.offsetY = 0;
    }

    applyCropTransform();
}

function getCropLimits() {
    const displayedWidth =
        cropState.baseWidth * cropState.zoom;

    const displayedHeight =
        cropState.baseHeight * cropState.zoom;

    return {
        maxX: Math.max(
            0,
            (displayedWidth - cropState.frameWidth) / 2
        ),

        maxY: Math.max(
            0,
            (displayedHeight - cropState.frameHeight) / 2
        )
    };
}

function clampCropPosition() {
    const limits = getCropLimits();

    cropState.offsetX = Math.min(
        limits.maxX,
        Math.max(-limits.maxX, cropState.offsetX)
    );

    cropState.offsetY = Math.min(
        limits.maxY,
        Math.max(-limits.maxY, cropState.offsetY)
    );
}

function applyCropTransform() {
    if (
        !cropImage.naturalWidth ||
        !cropState.baseWidth
    ) {
        return;
    }

    clampCropPosition();

    cropImage.style.width =
        `${cropState.baseWidth}px`;

    cropImage.style.height =
        `${cropState.baseHeight}px`;

    cropImage.style.left =
        `calc(50% + ${cropState.offsetX}px)`;

    cropImage.style.top =
        `calc(50% + ${cropState.offsetY}px)`;

    cropImage.style.transform =
        `translate(-50%, -50%) scale(${cropState.zoom})`;

    cropZoom.value = String(cropState.zoom);

    cropZoomValue.textContent =
        `${Math.round(cropState.zoom * 100)}%`;
}


// ======================================
// CROP ZOOM
// ======================================

cropZoom.addEventListener("input", function () {
    cropState.zoom = Number(cropZoom.value);
    applyCropTransform();
});


// Mouse wheel zoom is convenient on desktop.
cropViewport.addEventListener(
    "wheel",
    function (event) {
        if (cropModal.hidden) {
            return;
        }

        event.preventDefault();

        const zoomStep =
            event.deltaY < 0
                ? 0.08
                : -0.08;

        cropState.zoom = Math.min(
            3,
            Math.max(
                1,
                cropState.zoom + zoomStep
            )
        );

        applyCropTransform();
    },
    {
        passive: false
    }
);


// ======================================
// DRAG IMAGE INSIDE CROP FRAME
// ======================================

cropViewport.addEventListener("pointerdown", function (event) {
    if (!cropState.sourceFile) {
        return;
    }

    event.preventDefault();

    cropState.dragging = true;
    cropState.pointerId = event.pointerId;

    cropState.startPointerX =
        event.clientX;

    cropState.startPointerY =
        event.clientY;

    cropState.startOffsetX =
        cropState.offsetX;

    cropState.startOffsetY =
        cropState.offsetY;

    cropViewport.classList.add("dragging");

    cropViewport.setPointerCapture(
        event.pointerId
    );
});

cropViewport.addEventListener("pointermove", function (event) {
    if (
        !cropState.dragging ||
        event.pointerId !== cropState.pointerId
    ) {
        return;
    }

    const deltaX =
        event.clientX -
        cropState.startPointerX;

    const deltaY =
        event.clientY -
        cropState.startPointerY;

    cropState.offsetX =
        cropState.startOffsetX +
        deltaX;

    cropState.offsetY =
        cropState.startOffsetY +
        deltaY;

    applyCropTransform();
});

cropViewport.addEventListener(
    "pointerup",
    stopCropDragging
);

cropViewport.addEventListener(
    "pointercancel",
    stopCropDragging
);

cropViewport.addEventListener(
    "lostpointercapture",
    stopCropDragging
);

function stopCropDragging(event) {
    if (!cropState.dragging) {
        return;
    }

    if (
        event &&
        event.pointerId !== undefined &&
        cropState.pointerId !== null &&
        event.pointerId !== cropState.pointerId
    ) {
        return;
    }

    if (
        cropState.pointerId !== null &&
        cropViewport.hasPointerCapture &&
        cropViewport.hasPointerCapture(
            cropState.pointerId
        )
    ) {
        cropViewport.releasePointerCapture(
            cropState.pointerId
        );
    }

    cropState.dragging = false;
    cropState.pointerId = null;

    cropViewport.classList.remove(
        "dragging"
    );
}


// ======================================
// EXPORT CROPPED PROFILE IMAGE
// ======================================

async function createCroppedProfileFile() {
    if (
        !cropState.sourceFile ||
        !cropImage.naturalWidth ||
        !cropState.frameWidth ||
        !cropState.baseWidth
    ) {
        throw new Error(
            "자를 프로필 이미지가 없습니다."
        );
    }

    const naturalWidth =
        cropImage.naturalWidth;

    const naturalHeight =
        cropImage.naturalHeight;

    const frameWidth =
        cropState.frameWidth;

    const frameHeight =
        cropState.frameHeight;

    const coverScale =
        cropState.baseWidth /
        naturalWidth;

    const finalDisplayScale =
        coverScale *
        cropState.zoom;

    const displayedWidth =
        naturalWidth *
        finalDisplayScale;

    const displayedHeight =
        naturalHeight *
        finalDisplayScale;

    /*
        Position of the source image's
        top-left corner inside the crop frame.
    */

    const displayedLeft =
        frameWidth / 2 +
        cropState.offsetX -
        displayedWidth / 2;

    const displayedTop =
        frameHeight / 2 +
        cropState.offsetY -
        displayedHeight / 2;

    let sourceX =
        -displayedLeft /
        finalDisplayScale;

    let sourceY =
        -displayedTop /
        finalDisplayScale;

    const sourceWidth =
        frameWidth /
        finalDisplayScale;

    const sourceHeight =
        frameHeight /
        finalDisplayScale;

    sourceX = Math.max(
        0,
        Math.min(
            naturalWidth - sourceWidth,
            sourceX
        )
    );

    sourceY = Math.max(
        0,
        Math.min(
            naturalHeight - sourceHeight,
            sourceY
        )
    );

    /*
        Castfolio profile frame:
        4 : 5
    */

    const outputWidth =
        1200;

    const outputHeight =
        1500;

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        outputWidth;

    canvas.height =
        outputHeight;

    const context =
        canvas.getContext(
            "2d"
        );

    if (!context) {
        throw new Error(
            "이미지 편집을 위한 Canvas를 사용할 수 없습니다."
        );
    }

    context.imageSmoothingEnabled =
        true;

    context.imageSmoothingQuality =
        "high";

    context.drawImage(
        cropImage,

        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,

        0,
        0,
        outputWidth,
        outputHeight
    );

    const blob =
        await new Promise(
            function (
                resolve,
                reject
            ) {

                canvas.toBlob(
                    function (result) {

                        if (result) {
                            resolve(
                                result
                            );

                            return;
                        }

                        reject(
                            new Error(
                                "프로필 이미지를 자르는 데 실패했습니다."
                            )
                        );

                    },

                    "image/webp",
                    0.92
                );

            }
        );

    return new File(
        [
            blob
        ],

        "profile-cropped.webp",

        {
            type:
                "image/webp"
        }
    );
}


// ======================================
// CROP METADATA
// ======================================

function makeCurrentCropMetadata() {
    return {
        zoom:
            cropState.zoom,

        offsetXRatio:
            cropState.offsetX /
            cropState.frameWidth,

        offsetYRatio:
            cropState.offsetY /
            cropState.frameHeight,

        aspectRatio:
            4 / 5,

        originalWidth:
            cropImage.naturalWidth,

        originalHeight:
            cropImage.naturalHeight
    };
}


// ======================================
// CONFIRM CROP
// ======================================

cropConfirmButton.addEventListener(
    "click",

    async function () {

        if (!cropState.sourceFile) {
            return;
        }

        const selectedOriginalFile =
            cropState.sourceFile;

        try {

            cropConfirmButton.disabled =
                true;

            cropConfirmButton.textContent =
                "처리 중...";


            const croppedFile =
                await createCroppedProfileFile();


            const cropMetadata =
                makeCurrentCropMetadata();


            /*
                Only replace the existing
                profile after cropping succeeds.
            */

            profileOriginalFile =
                selectedOriginalFile;

            profileCroppedFile =
                croppedFile;

            profileCropMetadata =
                cropMetadata;


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
                "자르기";

        }

    }
);


// ======================================
// PROFILE PREVIEW
// ======================================

function setProfilePreview(file) {
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
// KEEP CROP CORRECT ON RESIZE
// ======================================

window.addEventListener(
    "resize",

    function () {

        if (
            !cropModal.hidden &&
            cropImage.naturalWidth
        ) {
            calculateCropBaseSize(
                false
            );
        }

    }
);


// ======================================
// GALLERY
// ======================================

galleryAddButton.addEventListener(
    "click",

    function () {
        galleryInput.click();
    }
);


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
            selectedFiles.length === 0
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


    galleryFiles.forEach(
        function (
            file,
            index
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


            const objectUrl =
                URL.createObjectURL(
                    file
                );


            img.src =
                objectUrl;

            img.alt =
                `갤러리 이미지 ${index + 1}`;


            img.onload =
                function () {

                    URL.revokeObjectURL(
                        objectUrl
                    );

                };


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

                function () {

                    galleryFiles.splice(
                        index,
                        1
                    );

                    renderGallery();

                }
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
    );
}


// ======================================
// HELPERS
// ======================================

function cleanValue(id) {
    const element =
        document.getElementById(
            id
        );

    return element
        ? element.value.trim()
        : "";
}


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
// UPLOAD FILE
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
                : "저장";


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
// SAVE CHARACTER
// ======================================

characterForm.addEventListener(
    "submit",

    async function (event) {

        event.preventDefault();


        // ==================================
        // CHECK LOGIN
        // ==================================

        if (!signedInUser) {

            setSavingState(
                false,
                "로그인 정보를 확인할 수 없습니다.",
                "error"
            );

            return;
        }


        // ==================================
        // CHARACTER DATA
        // ==================================

        const characterData = {

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


            // ==================================
            // GENERAL
            // ==================================

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


            // ==================================
            // APPEARANCE
            // ==================================

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


            // ==================================
            // FREE WRITING
            // ==================================

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
                ),


            // ==================================
            // PROFILE IMAGE
            // ==================================

            /*
                Final 4:5 cropped image.
            */

            profileImageUrl:
                "",


            /*
                Original image is also saved
                for future Edit Character.
            */

            profileOriginalImageUrl:
                "",


            /*
                Crop information.
            */

            profileCrop:
                null,


            // ==================================
            // GALLERY
            // ==================================

            galleryImages:
                [],


            // ==================================
            // TIMESTAMPS
            // ==================================

            createdAt:
                serverTimestamp(),


            updatedAt:
                serverTimestamp()

        };


        // ==================================
        // SAVE
        // ==================================

        try {

            setSavingState(
                true,
                "캐릭터 정보를 저장하고 있습니다..."
            );


            // ==================================
            // CREATE CHARACTER DOCUMENT
            // ==================================

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
                    characterData
                );


            const characterId =
                characterDoc.id;


            let profileImageUrl =
                "";


            let profileOriginalImageUrl =
                "";


            const galleryImageUrls =
                [];


            // ==================================
            // PROFILE IMAGE
            // ==================================

            if (
                profileOriginalFile &&
                profileCroppedFile
            ) {

                /*
                    Original image
                */

                const originalFileName =
                    makeStorageFileName(
                        profileOriginalFile
                    );


                profileOriginalImageUrl =
                    await uploadFile(

                        profileOriginalFile,

                        `users/` +
                        `${signedInUser.uid}/` +
                        `characters/` +
                        `${characterId}/` +
                        `profile/` +
                        `original/` +
                        `${originalFileName}`

                    );


                /*
                    Cropped 4:5 image
                */

                profileImageUrl =
                    await uploadFile(

                        profileCroppedFile,

                        `users/` +
                        `${signedInUser.uid}/` +
                        `characters/` +
                        `${characterId}/` +
                        `profile/` +
                        `cropped/` +
                        `profile-cropped.webp`

                    );

            }


            // ==================================
            // GALLERY IMAGES
            // ==================================

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

                        `users/` +
                        `${signedInUser.uid}/` +
                        `characters/` +
                        `${characterId}/` +
                        `gallery/` +
                        `${galleryFileName}`

                    );


                galleryImageUrls.push(
                    imageUrl
                );

            }


            // ==================================
            // UPDATE FIRESTORE
            // ==================================

            await updateDoc(

                doc(
                    db,
                    "users",
                    signedInUser.uid,
                    "characters",
                    characterId
                ),

                {

                    profileImageUrl:
                        profileImageUrl,


                    profileOriginalImageUrl:
                        profileOriginalImageUrl,


                    profileCrop:
                        profileCropMetadata,


                    galleryImages:
                        galleryImageUrls,


                    updatedAt:
                        serverTimestamp()

                }

            );


            // ==================================
            // SUCCESS
            // ==================================

            setSavingState(
                false,
                "저장되었습니다.",
                "success"
            );


            /*
                After saving, move to
                My Characters page.
            */

            window.setTimeout(

                function () {

                    window.location.href =
                        "my-characters.html";

                },

                500

            );

        }


        // ==================================
        // ERROR
        // ==================================

        catch (error) {

            console.error(
                "Character save failed:",
                error
            );


            setSavingState(
                false,
                "저장에 실패했습니다. Firebase 설정과 권한을 확인해 주세요.",
                "error"
            );


            alert(
                "캐릭터 저장에 실패했습니다.\n\n" +
                (error.code || "") +
                "\n" +
                error.message
            );

        }

    }
);


// ======================================
// CLEAN UP OBJECT URL
// ======================================

window.addEventListener(
    "beforeunload",

    function () {

        if (profilePreviewUrl) {

            URL.revokeObjectURL(
                profilePreviewUrl
            );

        }


        cleanupCropSource();

    }
);