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
    getDocs,
    deleteDoc,
    doc
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


import {
    getStorage,
    ref,
    deleteObject
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";


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

const characterGrid =
    document.getElementById(
        "characterGrid"
    );


const loadingState =
    document.getElementById(
        "loadingState"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
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


let loadedCharacters =
    [];


let characterPendingDelete =
    null;



// ======================================
// AUTHENTICATION
// ======================================

onAuthStateChanged(

    auth,

    async function (user) {

        if (!user) {

            alert(
                "내 캐릭터 페이지는 로그인 후 이용할 수 있습니다."
            );


            window.location.replace(
                "main.html"
            );


            return;

        }


        signedInUser =
            user;


        await loadCharacters();

    }

);



// ======================================
// LOAD CHARACTERS
// ======================================

async function loadCharacters() {

    if (!signedInUser) {

        return;

    }


    showLoadingState();


    try {

        const characterCollection =
            collection(

                db,

                "users",

                signedInUser.uid,

                "characters"

            );


        const snapshot =
            await getDocs(
                characterCollection
            );


        const characters =
            [];


        snapshot.forEach(

            function (documentSnapshot) {

                characters.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }

        );



        // ==================================
        // RANDOMIZE ORDER ON EACH PAGE LOAD
        // ==================================

        shuffleArray(
            characters
        );


        loadedCharacters =
            characters;


        renderCharacters();

    }


    catch (error) {

        console.error(
            "Failed to load characters:",
            error
        );


        showErrorState(
            "캐릭터 정보를 불러오는 중 오류가 발생했습니다."
        );

    }

}



// ======================================
// SHUFFLE
// ======================================

function shuffleArray(array) {

    for (

        let i =
            array.length - 1;

        i > 0;

        i -= 1

    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        const temp =
            array[i];


        array[i] =
            array[randomIndex];


        array[randomIndex] =
            temp;

    }


    return array;

}



// ======================================
// RENDER CHARACTERS
// ======================================

function renderCharacters() {

    characterGrid.innerHTML =
        "";


    if (
        loadedCharacters.length ===
        0
    ) {

        showEmptyState();

        return;

    }


    hideAllStates();


    characterGrid.hidden =
        false;



    loadedCharacters.forEach(

        function (character) {

            const card =
                createCharacterCard(
                    character
                );


            characterGrid.appendChild(
                card
            );

        }

    );

}



// ======================================
// CREATE CHARACTER CARD
// ======================================

function createCharacterCard(
    character
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "character-card";


    card.dataset.characterId =
        character.id;



    // ==================================
    // IMAGE
    // ==================================

    const imageWrapper =
        document.createElement(
            "div"
        );


    imageWrapper.className =
        "character-image-wrapper";



    const profileImage =
        document.createElement(
            "img"
        );


    profileImage.className =
        "character-profile-image";


    profileImage.src =
        character.profileImageUrl ||
        "images/castfolio.png";


    profileImage.alt =
        character.name
            ? `${character.name} 프로필 이미지`
            : "캐릭터 프로필 이미지";


    profileImage.loading =
        "lazy";



    profileImage.addEventListener(

        "error",

        function () {

            if (
                !profileImage.src.includes(
                    "castfolio.png"
                )
            ) {

                profileImage.src =
                    "images/castfolio.png";

            }

        }

    );



    imageWrapper.appendChild(
        profileImage
    );



    // ==================================
    // THREE DOT MENU
    // ==================================

    const menu =
        createCharacterMenu(
            character
        );


    imageWrapper.appendChild(
        menu
    );



    // ==================================
    // CONTENT
    // ==================================

    const content =
        document.createElement(
            "div"
        );


    content.className =
        "character-card-content";



    // ==================================
    // NAME
    // ==================================

    const name =
        document.createElement(
            "h2"
        );


    name.className =
        "character-name";


    name.textContent =
        character.name ||
        "이름 없음";



    // ==================================
    // SHORT DESCRIPTION
    // ==================================

    const shortDescription =
        document.createElement(
            "p"
        );


    shortDescription.className =
        "character-short-description";


    shortDescription.textContent =
        character.shortDescription ||
        "한줄설명이 없습니다.";



    // ==================================
    // GENERAL INFORMATION
    // ==================================

    const general =
        createGeneralInformation(
            character.general ||
            {}
        );



    content.appendChild(
        name
    );


    content.appendChild(
        shortDescription
    );


    content.appendChild(
        general
    );



    card.appendChild(
        imageWrapper
    );


    card.appendChild(
        content
    );


    return card;

}



// ======================================
// GENERAL INFORMATION
// ======================================

function createGeneralInformation(
    general
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "character-general";



    const fields = [

        {
            label:
                "나이",

            value:
                general.age
        },

        {
            label:
                "성별",

            value:
                general.gender
        },

        {
            label:
                "종족",

            value:
                general.species
        },

        {
            label:
                "키",

            value:
                general.height
        },

        {
            label:
                "몸무게",

            value:
                general.weight
        },

        {
            label:
                "직업",

            value:
                general.occupation
        },

        {
            label:
                "장르",

            value:
                general.genre
        }

    ];



    let visibleFieldCount =
        0;



    fields.forEach(

        function (field) {

            if (
                !field.value
            ) {

                return;

            }


            visibleFieldCount +=
                1;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "general-row";



            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "general-label";


            label.textContent =
                field.label;



            const value =
                document.createElement(
                    "span"
                );


            value.className =
                "general-value";


            value.textContent =
                field.value;



            row.appendChild(
                label
            );


            row.appendChild(
                value
            );


            wrapper.appendChild(
                row
            );

        }

    );



    // ==================================
    // IF NO GENERAL INFORMATION
    // ==================================

    if (
        visibleFieldCount ===
        0
    ) {

        const emptyRow =
            document.createElement(
                "div"
            );


        emptyRow.className =
            "general-row";


        const label =
            document.createElement(
                "span"
            );


        label.className =
            "general-label";


        label.textContent =
            "정보";



        const value =
            document.createElement(
                "span"
            );


        value.className =
            "general-value";


        value.textContent =
            "등록된 정보 없음";



        emptyRow.appendChild(
            label
        );


        emptyRow.appendChild(
            value
        );


        wrapper.appendChild(
            emptyRow
        );

    }



    // ==================================
    // TAGS
    // ==================================

    if (
        Array.isArray(
            general.tags
        ) &&
        general.tags.length >
        0
    ) {

        const tagWrapper =
            document.createElement(
                "div"
            );


        tagWrapper.className =
            "character-tags";



        general.tags

            .slice(
                0,
                5
            )

            .forEach(

                function (tagText) {

                    const tag =
                        document.createElement(
                            "span"
                        );


                    tag.className =
                        "character-tag";


                    tag.textContent =
                        `#${tagText}`;


                    tagWrapper.appendChild(
                        tag
                    );

                }

            );


        wrapper.appendChild(
            tagWrapper
        );

    }


    return wrapper;

}



// ======================================
// CHARACTER MENU
// ======================================

function createCharacterMenu(
    character
) {

    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "character-menu";



    const menuButton =
        document.createElement(
            "button"
        );


    menuButton.type =
        "button";


    menuButton.className =
        "character-menu-button";


    menuButton.setAttribute(
        "aria-label",
        "캐릭터 메뉴"
    );


    menuButton.textContent =
        "⋯";



    const dropdown =
        document.createElement(
            "div"
        );


    dropdown.className =
        "character-menu-dropdown";



    // ==================================
    // EDIT
    // ==================================

    const editButton =
        document.createElement(
            "button"
        );


    editButton.type =
        "button";


    editButton.className =
        "edit-character-button";


    editButton.textContent =
        "수정";



    editButton.addEventListener(

        "click",

        function (event) {

            event.stopPropagation();


            window.location.href =
                "edit-character.html?id=" +
                encodeURIComponent(
                    character.id
                );

        }

    );



    // ==================================
    // DELETE
    // ==================================

    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-character-button";


    deleteButton.textContent =
        "삭제";



    deleteButton.addEventListener(

        "click",

        function (event) {

            event.stopPropagation();


            closeAllCharacterMenus();


            openDeleteModal(
                character
            );

        }

    );



    // ==================================
    // OPEN / CLOSE MENU
    // ==================================

    menuButton.addEventListener(

        "click",

        function (event) {

            event.stopPropagation();


            const shouldOpen =
                !menu.classList.contains(
                    "open"
                );


            closeAllCharacterMenus();


            if (shouldOpen) {

                menu.classList.add(
                    "open"
                );

            }

        }

    );



    dropdown.appendChild(
        editButton
    );


    dropdown.appendChild(
        deleteButton
    );


    menu.appendChild(
        menuButton
    );


    menu.appendChild(
        dropdown
    );


    return menu;

}



// ======================================
// CLOSE ALL CARD MENUS
// ======================================

function closeAllCharacterMenus() {

    document

        .querySelectorAll(
            ".character-menu.open"
        )

        .forEach(

            function (menu) {

                menu.classList.remove(
                    "open"
                );

            }

        );

}



// ======================================
// CLICK OUTSIDE CHARACTER MENU
// ======================================

document.addEventListener(

    "click",

    function () {

        closeAllCharacterMenus();

    }

);



// ======================================
// OPEN DELETE MODAL
// ======================================

function openDeleteModal(
    character
) {

    characterPendingDelete =
        character;


    deleteCharacterName.textContent =
        character.name ||
        "이 캐릭터";


    deleteModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";

}



// ======================================
// CLOSE DELETE MODAL
// ======================================

function closeDeleteModal() {

    if (
        confirmDeleteButton.disabled
    ) {

        return;

    }


    characterPendingDelete =
        null;


    deleteModal.hidden =
        true;


    document.body.style.overflow =
        "";

}



// ======================================
// MODAL EVENTS
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
            event.key ===
                "Escape" &&

            !deleteModal.hidden
        ) {

            closeDeleteModal();

        }

    }

);



// ======================================
// CONFIRM DELETE
// ======================================

confirmDeleteButton.addEventListener(

    "click",

    async function () {

        if (
            !characterPendingDelete ||
            !signedInUser
        ) {

            return;

        }


        const character =
            characterPendingDelete;



        try {

            setDeleteLoadingState(
                true
            );


            // ==================================
            // DELETE ALL CHARACTER IMAGES
            // ==================================

            await deleteCharacterImages(
                character
            );



            // ==================================
            // DELETE FIRESTORE DOCUMENT
            // ==================================

            await deleteDoc(

                doc(

                    db,

                    "users",

                    signedInUser.uid,

                    "characters",

                    character.id

                )

            );



            // ==================================
            // REMOVE FROM LOCAL LIST
            // ==================================

            loadedCharacters =
                loadedCharacters.filter(

                    function (item) {

                        return (
                            item.id !==
                            character.id
                        );

                    }

                );



            characterPendingDelete =
                null;


            deleteModal.hidden =
                true;


            document.body.style.overflow =
                "";


            setDeleteLoadingState(
                false
            );


            renderCharacters();

        }


        catch (error) {

            console.error(
                "Character delete failed:",
                error
            );


            setDeleteLoadingState(
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
// DELETE CHARACTER IMAGES
// ======================================

async function deleteCharacterImages(
    character
) {

    const imageUrls =
        new Set();



    // ==================================
    // PROFILE CROPPED IMAGE
    // ==================================

    if (
        character.profileImageUrl
    ) {

        imageUrls.add(
            character.profileImageUrl
        );

    }



    // ==================================
    // ORIGINAL PROFILE IMAGE
    // ==================================

    if (
        character.profileOriginalImageUrl
    ) {

        imageUrls.add(
            character.profileOriginalImageUrl
        );

    }



    // ==================================
    // GALLERY IMAGES
    // ==================================

    if (
        Array.isArray(
            character.galleryImages
        )
    ) {

        character.galleryImages.forEach(

            function (imageUrl) {

                if (imageUrl) {

                    imageUrls.add(
                        imageUrl
                    );

                }

            }

        );

    }



    // ==================================
    // DELETE EACH STORAGE FILE
    // ==================================

    for (
        const imageUrl
        of imageUrls
    ) {

        await deleteStorageImage(
            imageUrl
        );

    }

}



// ======================================
// DELETE ONE STORAGE IMAGE
// ======================================

async function deleteStorageImage(
    imageUrl
) {

    try {

        const imageRef =
            ref(
                storage,
                imageUrl
            );


        await deleteObject(
            imageRef
        );

    }


    catch (error) {

        /*
            If the image is already gone,
            continue deleting the character.
        */

        if (
            error.code ===
            "storage/object-not-found"
        ) {

            return;

        }


        throw error;

    }

}



// ======================================
// DELETE BUTTON STATE
// ======================================

function setDeleteLoadingState(
    isDeleting
) {

    confirmDeleteButton.disabled =
        isDeleting;


    cancelDeleteButton.disabled =
        isDeleting;


    deleteModalClose.disabled =
        isDeleting;


    confirmDeleteButton.textContent =
        isDeleting
            ? "삭제 중..."
            : "삭제";

}



// ======================================
// PAGE STATES
// ======================================

function hideAllStates() {

    loadingState.hidden =
        true;


    emptyState.hidden =
        true;


    errorState.hidden =
        true;


    characterGrid.hidden =
        true;

}



function showLoadingState() {

    hideAllStates();


    loadingState.hidden =
        false;

}



function showEmptyState() {

    hideAllStates();


    emptyState.hidden =
        false;

}



function showErrorState(
    message
) {

    hideAllStates();


    errorMessage.textContent =
        message;


    errorState.hidden =
        false;

}