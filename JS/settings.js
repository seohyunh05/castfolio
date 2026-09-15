// ======================================
// SHARED FIREBASE / HEADER
// ======================================

import {
    auth,
    googleProvider,
    updateHeaderProfile
} from "./main.js?v=10";


import {
    onAuthStateChanged,
    updateProfile,
    deleteUser,
    reauthenticateWithPopup
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";



// ======================================
// ELEMENTS
// ======================================

const settingsPage =
    document.getElementById(
        "settingsPage"
    );


const profileImage =
    document.getElementById(
        "profileImage"
    );


const profileName =
    document.getElementById(
        "profileName"
    );


const profileEmail =
    document.getElementById(
        "profileEmail"
    );


const usernameInput =
    document.getElementById(
        "usernameInput"
    );


const emailInput =
    document.getElementById(
        "emailInput"
    );


const photoURLInput =
    document.getElementById(
        "photoURLInput"
    );


const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );


const settingsMessage =
    document.getElementById(
        "settingsMessage"
    );


const deleteAccountButton =
    document.getElementById(
        "deleteAccountButton"
    );


const deleteModal =
    document.getElementById(
        "deleteModal"
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
// CURRENT USER
// ======================================

let currentUser =
    null;



// ======================================
// AUTH STATE
// ======================================

onAuthStateChanged(
    auth,

    async function (user) {

        // Not logged in

        if (!user) {

            window.location.href =
                "main.html";


            return;

        }



        // Get newest profile information

        try {

            await user.reload();

        }

        catch (error) {

            console.warn(
                "Could not reload user:",
                error
            );

        }



        currentUser =
            auth.currentUser ||
            user;



        // Show page

        settingsPage.style.visibility =
            "visible";



        // Load current data

        loadUserProfile(
            currentUser
        );



        // Make sure navbar also has
        // current profile information.

        updateHeaderProfile(
            currentUser
        );

    }
);



// ======================================
// LOAD USER PROFILE
// ======================================

function loadUserProfile(user) {

    const displayName =
        user.displayName ||
        "사용자";


    const email =
        user.email ||
        "";



    profileName.textContent =
        displayName;


    profileEmail.textContent =
        email;


    usernameInput.value =
        displayName;


    emailInput.value =
        email;



    // Profile image

    if (user.photoURL) {

        profileImage.src =
            user.photoURL;


        photoURLInput.value =
            user.photoURL;

    }

    else {

        profileImage.src =
            "images/castfolio.png";


        photoURLInput.value =
            "";

    }

}



// ======================================
// IMAGE PREVIEW
// ======================================

photoURLInput.addEventListener(
    "input",

    function () {

        const url =
            photoURLInput.value.trim();



        if (url) {

            profileImage.src =
                url;

        }

        else if (
            currentUser &&
            currentUser.photoURL
        ) {

            profileImage.src =
                currentUser.photoURL;

        }

        else {

            profileImage.src =
                "images/castfolio.png";

        }

    }
);



// ======================================
// SETTINGS IMAGE ERROR
// ======================================

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



// ======================================
// SAVE PROFILE
// ======================================

saveProfileButton.addEventListener(
    "click",

    async function () {

        if (!currentUser) {

            return;

        }



        const newUsername =
            usernameInput.value.trim();


        const newPhotoURL =
            photoURLInput.value.trim();



        // Username required

        if (!newUsername) {

            showMessage(
                "사용자 이름을 입력해 주세요.",
                "error"
            );


            return;

        }



        try {

            saveProfileButton.disabled =
                true;


            saveProfileButton.textContent =
                "저장 중...";



            // ==================================
            // SAVE USERNAME + IMAGE TO FIREBASE
            // ==================================

            const profileData = {

                displayName:
                    newUsername

            };



            /*
                If an image URL was entered,
                save that URL.

                If nothing was entered,
                keep the current Firebase photo.
            */

            if (newPhotoURL) {

                profileData.photoURL =
                    newPhotoURL;

            }

            else {

                profileData.photoURL =
                    currentUser.photoURL ||
                    null;

            }



            await updateProfile(
                currentUser,
                profileData
            );



            /*
                Firebase updateProfile updates
                the current user object.

                Reload afterwards to make sure
                we have exactly what Firebase
                saved.
            */

            try {

                await currentUser.reload();

            }

            catch (reloadError) {

                console.warn(
                    "Could not reload profile:",
                    reloadError
                );

            }



            currentUser =
                auth.currentUser;



            // ==================================
            // UPDATE SETTINGS PAGE
            // ==================================

            profileName.textContent =
                currentUser.displayName ||
                newUsername;



            if (currentUser.photoURL) {

                profileImage.src =
                    currentUser.photoURL;

            }

            else {

                profileImage.src =
                    "images/castfolio.png";

            }



            // ==================================
            // UPDATE TOP NAVBAR IMMEDIATELY
            // ==================================

            updateHeaderProfile(
                currentUser
            );



            showMessage(
                "프로필이 저장되었습니다.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Profile update failed:",
                error
            );


            showMessage(
                "프로필 저장에 실패했습니다.",
                "error"
            );

        }

        finally {

            saveProfileButton.disabled =
                false;


            saveProfileButton.textContent =
                "변경사항 저장";

        }

    }
);



// ======================================
// STATUS MESSAGE
// ======================================

function showMessage(
    message,
    type
) {

    settingsMessage.textContent =
        message;


    settingsMessage.className =
        "settings-message " +
        type;



    setTimeout(
        function () {

            settingsMessage.className =
                "settings-message";

        },

        3500
    );

}



// ======================================
// OPEN DELETE MODAL
// ======================================

deleteAccountButton.addEventListener(
    "click",

    function () {

        deleteModal.classList.add(
            "show"
        );

    }
);



// ======================================
// CLOSE DELETE MODAL
// ======================================

cancelDeleteButton.addEventListener(
    "click",

    function () {

        deleteModal.classList.remove(
            "show"
        );

    }
);



deleteModal.addEventListener(
    "click",

    function (event) {

        if (
            event.target ===
            deleteModal
        ) {

            deleteModal.classList.remove(
                "show"
            );

        }

    }
);



document.addEventListener(
    "keydown",

    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            deleteModal.classList.remove(
                "show"
            );

        }

    }
);



// ======================================
// DELETE ACCOUNT
// ======================================

confirmDeleteButton.addEventListener(
    "click",

    async function () {

        if (!currentUser) {

            return;

        }



        try {

            confirmDeleteButton.disabled =
                true;


            confirmDeleteButton.textContent =
                "삭제 중...";



            await deleteUser(
                currentUser
            );



            window.location.href =
                "main.html";

        }

        catch (error) {

            console.error(
                "Delete account error:",
                error
            );



            // Recent login required

            if (
                error.code ===
                "auth/requires-recent-login"
            ) {

                try {

                    await reauthenticateWithPopup(
                        currentUser,
                        googleProvider
                    );


                    await deleteUser(
                        currentUser
                    );


                    window.location.href =
                        "main.html";

                }

                catch (reauthError) {

                    console.error(
                        "Reauthentication failed:",
                        reauthError
                    );


                    alert(
                        "계정 인증에 실패했습니다."
                    );

                }

            }

            else {

                alert(
                    "계정 삭제에 실패했습니다."
                );

            }

        }

        finally {

            confirmDeleteButton.disabled =
                false;


            confirmDeleteButton.textContent =
                "계정 삭제";

        }

    }
);