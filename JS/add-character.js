// ======================================
// FIREBASE IMPORTS
// ======================================

import {
    getApp
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";


/*
    Reuse the Firebase authentication
    object already created in main.js.
*/

import {
    auth
} from
    "./main.js?v=10";



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



// Profile Image

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



// Gallery

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



// Short Description

const shortDescription =
    document.getElementById(
        "shortDescription"
    );


const shortDescriptionCount =
    document.getElementById(
        "shortDescriptionCount"
    );



// Gender

const genderInput =
    document.getElementById(
        "gender"
    );


const genderButtons =
    document.querySelectorAll(
        ".gender-button"
    );



// Tabs

const tabButtons =
    document.querySelectorAll(
        ".tab-button"
    );


const tabPanels =
    document.querySelectorAll(
        "[data-tab-panel]"
    );



// ======================================
// VARIABLES
// ======================================

let signedInUser =
    null;


let profileImageFile =
    null;


let galleryFiles =
    [];



// ======================================
// LOGIN PROTECTION
// ======================================

onAuthStateChanged(
    auth,

    function (user) {

        /*
            Only logged-in users may access
            the Add Character page.
        */

        if (!user) {

            alert(
                "캐릭터 추가는 로그인 후 이용할 수 있습니다."
            );


            window.location.replace(
                "main.html"
            );


            return;
        }


        signedInUser =
            user;

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


                /*
                    Update tab buttons
                */

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


                /*
                    Update tab panels
                */

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
// GENDER BUTTONS
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

shortDescription.addEventListener(

    "input",

    function () {

        shortDescriptionCount.textContent =
            `${shortDescription.value.length} / 120`;

    }

);



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
// PROFILE IMAGE CHANGE
// ======================================

profileImageInput.addEventListener(

    "change",

    function () {

        const file =
            profileImageInput.files[0];


        if (!file) {

            return;

        }


        /*
            Only images
        */

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


        profileImageFile =
            file;


        /*
            Preview selected profile image
        */

        const objectUrl =
            URL.createObjectURL(
                file
            );


        profilePreview.src =
            objectUrl;


        profilePreview.hidden =
            false;


        profilePlaceholder.hidden =
            true;


        profilePreview.onload =
            function () {

                URL.revokeObjectURL(
                    objectUrl
                );

            };

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
// GALLERY FILE SELECTION
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
            selectedFiles.length === 0
        ) {

            galleryInput.value =
                "";


            return;
        }


        /*
            Add newly selected files
            to existing gallery files.
        */

        galleryFiles.push(
            ...selectedFiles
        );


        /*
            Reset file input so the user
            can select the same file again later.
        */

        galleryInput.value =
            "";


        renderGallery();

    }

);



// ======================================
// RENDER GALLERY
// ======================================

function renderGallery() {

    /*
        Remove existing preview cards.

        Do NOT remove the + Add button.
    */

    galleryGrid
        .querySelectorAll(
            ".gallery-card"
        )

        .forEach(

            function (card) {

                card.remove();

            }

        );


    /*
        Render every selected image.
    */

    galleryFiles.forEach(

        function (file, index) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "gallery-card";



            // Image

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



            // Delete Button

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



            // Add image and button

            card.appendChild(
                img
            );


            card.appendChild(
                removeButton
            );


            /*
                Insert images before
                the + Add Image button.
            */

            galleryGrid.insertBefore(
                card,
                galleryAddButton
            );

        }

    );

}



// ======================================
// GET CLEAN INPUT VALUE
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



// ======================================
// TAG ARRAY
// ======================================

function makeTagArray(
    tagString
) {

    /*
        "판타지, 기사, 기사"

        becomes

        [
            "판타지",
            "기사"
        ]
    */

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


    /*
        Set removes duplicate tags.
    */

    return [
        ...new Set(
            normalized
        )
    ];

}



// ======================================
// FILE NAME SAFETY
// ======================================

function sanitizeFileName(
    fileName
) {

    return fileName.replace(
        /[^a-zA-Z0-9가-힣._-]/g,
        "_"
    );

}



// ======================================
// UNIQUE STORAGE FILE NAME
// ======================================

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
// UPLOAD FILE TO FIREBASE STORAGE
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
        // CREATE CHARACTER DATA
        // ==================================

        const characterData = {

            /*
                Owner
            */

            ownerId:
                signedInUser.uid,


            ownerName:
                signedInUser.displayName ||
                signedInUser.email ||
                "사용자",



            /*
                Main Information
            */

            name:
                cleanValue(
                    "characterName"
                ),


            shortDescription:
                cleanValue(
                    "shortDescription"
                ),



            /*
                General
            */

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



            /*
                Appearance
            */

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



            /*
                Free Writing
            */

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



            /*
                Images

                URLs will be added after
                Firebase Storage upload.
            */

            profileImageUrl:
                "",


            galleryImages:
                [],



            /*
                Dates
            */

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
            // CREATE FIRESTORE DOCUMENT
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



            // ==================================
            // PROFILE IMAGE UPLOAD
            // ==================================

            let profileImageUrl =
                "";


            const galleryImageUrls =
                [];


            if (profileImageFile) {

                const profileFileName =
                    makeStorageFileName(
                        profileImageFile
                    );


                profileImageUrl =
                    await uploadFile(

                        profileImageFile,

                        `users/` +
                        `${signedInUser.uid}/` +
                        `characters/` +
                        `${characterId}/` +
                        `profile/` +
                        `${profileFileName}`

                    );

            }



            // ==================================
            // GALLERY IMAGE UPLOAD
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
            // UPDATE FIRESTORE WITH IMAGE URLS
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
                Later this will lead to the
                My Characters page.

                You do not have that page yet,
                but this is the filename we
                already use in the navbar.
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