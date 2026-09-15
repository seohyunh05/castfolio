// ======================================
// FIREBASE IMPORTS
// ======================================

import {
    initializeApp
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";



// ======================================
// FIREBASE CONFIG
// ======================================

const firebaseConfig = {
    apiKey:"AIzaSyD_TgMbeROT-9iTfoFRsVLBQ4v5LxF7EXg",
    authDomain:"castfolio-40518.firebaseapp.com",
    projectId:"castfolio-40518",
    storageBucket:"castfolio-40518.firebasestorage.app",
    messagingSenderId:"140948378424",
    appId:"1:140948378424:web:58992103e71451a09b67cd",
    measurementId:"G-5Y3Z9XG3CW"
};



// ======================================
// FIREBASE INITIALIZATION
// ======================================

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(
        app
    );


const googleProvider =
    new GoogleAuthProvider();



googleProvider.setCustomParameters({

    prompt:
        "select_account"

});



// ======================================
// EXPORTS
// ======================================

export {
    auth,
    googleProvider
};



// ======================================
// ELEMENTS
// ======================================

const loginButton =
    document.getElementById(
        "loginButton"
    );


const headerUserProfile =
    document.getElementById(
        "headerUserProfile"
    );


const headerProfileImage =
    document.getElementById(
        "headerProfileImage"
    );


const headerProfileName =
    document.getElementById(
        "headerProfileName"
    );


const moreButton =
    document.getElementById(
        "moreButton"
    );


const dropdown =
    document.querySelector(
        ".dropdown"
    );


const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );


const navMenu =
    document.getElementById(
        "navMenu"
    );



// ======================================
// CURRENT USER
// ======================================

let currentUser =
    null;



// ======================================
// UPDATE HEADER
// ======================================

export function updateHeaderProfile(user) {

    if (!loginButton) {

        return;

    }



    // ==================================
    // LOGGED OUT
    // ==================================

    if (!user) {

        loginButton.textContent =
            "로그인";


        if (headerUserProfile) {

            headerUserProfile.hidden =
                true;

        }


        if (headerProfileName) {

            headerProfileName.textContent =
                "";

        }


        if (headerProfileImage) {

            headerProfileImage.src =
                "images/castfolio.png";

        }


        return;

    }



    // ==================================
    // LOGGED IN
    // ==================================

    loginButton.textContent =
        "로그아웃";



    // Show user profile

    if (headerUserProfile) {

        headerUserProfile.hidden =
            false;

    }



    // ==================================
    // USERNAME
    // ==================================

    let username =
        user.displayName;


    if (
        !username &&
        user.email
    ) {

        username =
            user.email.split("@")[0];

    }


    if (headerProfileName) {

        headerProfileName.textContent =
            username ||
            "사용자";

    }



    // ==================================
    // PROFILE IMAGE
    // ==================================

    if (headerProfileImage) {

        if (user.photoURL) {

            headerProfileImage.src =
                user.photoURL;

        }

        else {

            headerProfileImage.src =
                "images/castfolio.png";

        }

    }

}



// ======================================
// PROFILE IMAGE ERROR
// ======================================

if (headerProfileImage) {

    headerProfileImage.addEventListener(
        "error",

        function () {

            /*
                Prevent infinite error loop.
            */

            if (
                !headerProfileImage.src.includes(
                    "castfolio.png"
                )
            ) {

                headerProfileImage.src =
                    "images/castfolio.png";

            }

        }
    );

}



// ======================================
// DROPDOWN
// ======================================

if (
    moreButton &&
    dropdown
) {

    moreButton.addEventListener(
        "click",

        function (event) {

            event.stopPropagation();


            dropdown.classList.toggle(
                "active"
            );

        }
    );


    document.addEventListener(
        "click",

        function (event) {

            if (
                !dropdown.contains(
                    event.target
                )
            ) {

                dropdown.classList.remove(
                    "active"
                );

            }

        }
    );

}



// ======================================
// MOBILE MENU
// ======================================

if (
    mobileMenuButton &&
    navMenu
) {

    mobileMenuButton.addEventListener(
        "click",

        function () {

            navMenu.classList.toggle(
                "mobile-open"
            );

        }
    );

}



// ======================================
// LOGIN WITH GOOGLE
// ======================================

async function loginWithGoogle() {

    try {

        await setPersistence(
            auth,
            browserLocalPersistence
        );


        await signInWithRedirect(
            auth,
            googleProvider
        );

    }

    catch (error) {

        console.error(
            "Google login failed:",
            error
        );


        alert(
            "Google 로그인에 실패했습니다.\n\n" +
            (error.code || "") +
            "\n" +
            error.message
        );

    }

}



// ======================================
// LOGOUT
// ======================================

async function logout() {

    try {

        await signOut(
            auth
        );


        /*
            onAuthStateChanged() below
            automatically removes the
            profile from the header.
        */

    }

    catch (error) {

        console.error(
            "Logout failed:",
            error
        );


        alert(
            "로그아웃에 실패했습니다."
        );

    }

}



// ======================================
// LOGIN / LOGOUT BUTTON
// ======================================

if (loginButton) {

    loginButton.addEventListener(
        "click",

        function () {

            if (currentUser) {

                logout();

            }

            else {

                loginWithGoogle();

            }

        }
    );

}



// ======================================
// GOOGLE REDIRECT RESULT
// ======================================

async function checkRedirectResult() {

    try {

        const result =
            await getRedirectResult(
                auth
            );


        if (
            result &&
            result.user
        ) {

            console.log(
                "Login successful:",
                result.user.displayName
            );

        }

    }

    catch (error) {

        console.error(
            "Redirect login error:",
            error
        );

    }

}



// ======================================
// AUTH STATE
// ======================================

onAuthStateChanged(
    auth,

    async function (user) {

        // Logged out

        if (!user) {

            currentUser =
                null;


            updateHeaderProfile(
                null
            );


            return;

        }



        /*
            Reload Firebase user data.

            This makes sure a username or
            profile photo changed in the
            Settings page is loaded here.
        */

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



        updateHeaderProfile(
            currentUser
        );

    }
);



// ======================================
// PAGE LOAD
// ======================================

checkRedirectResult();