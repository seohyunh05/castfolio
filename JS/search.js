// ======================================
// MAIN.JS
// ======================================
import {
    auth
} from "./main.js?v=10";

import {
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getApp
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ======================================
// FIRESTORE
// ======================================
const app =
    getApp();

const db =
    getFirestore(
        app
    );


// ======================================
// ELEMENTS
// ======================================
const searchInput =
    document.getElementById(
        "searchInput"
    );

const clearSearchButton =
    document.getElementById(
        "clearSearchButton"
    );

const genreFilter =
    document.getElementById(
        "genreFilter"
    );

const resetFilterButton =
    document.getElementById(
        "resetFilterButton"
    );

const noResultsResetButton =
    document.getElementById(
        "noResultsResetButton"
    );

const resultCount =
    document.getElementById(
        "resultCount"
    );

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

const noResultsState =
    document.getElementById(
        "noResultsState"
    );


// ======================================
// DATA
// ======================================
let characters =
    [];

let currentUser =
    null;


// ======================================
// AUTH CHECK
// ======================================
onAuthStateChanged(

    auth,
    async function (user) {
        if (!user) {
            window.location.href =
                "main.html";
            return;
        }
        currentUser =
            user;
        await loadCharacters();
    }
);


// ======================================
// LOAD CHARACTERS
// ======================================
async function loadCharacters() {
    showLoading();

    try {
        const characterCollection =
            collection(
                db,
                "users",
                currentUser.uid,
                "characters"
            );

        const snapshot =
            await getDocs(
                characterCollection
            );

        characters =
            snapshot.docs.map(
                function (document) {
                    return {
                        id:
                            document.id,
                        ...document.data()
                    };
                }
            );
        hideLoading();
        filterCharacters();
    }

    catch (error) {
        console.error(
            "Could not load characters:",
            error
        );
        hideLoading();

        characterGrid.innerHTML =
            "";
        resultCount.textContent =
            "0개의 캐릭터";
        emptyState.hidden =
            false;

        const heading =
            emptyState.querySelector(
                "h2"
            );

        const message =
            emptyState.querySelector(
                "p"
            );

        if (heading) {
            heading.textContent =
                "캐릭터를 불러오지 못했습니다";
        }

        if (message) {
            message.textContent =
                "잠시 후 다시 시도해 주세요.";
        }
    }
}


// ======================================
// FILTER CHARACTERS
// ======================================
function filterCharacters() {
    const searchText =
        searchInput
            .value
            .trim()
            .toLowerCase();

    const selectedGenre =
        genreFilter.value;

    const filtered =
        characters.filter(
            function (character) {

                const general =
                    character.general ||
                    {};

                const name =
                    String(
                        character.name ||
                        ""
                    )
                        .toLowerCase();

                const tags =
                    normalizeTags(
                        general.tags ||
                        character.tags
                    );

                const lowercaseTags =
                    tags.map(

                        function (tag) {
                            return String(
                                tag
                            ).toLowerCase();
                        }
                    );

                const genre =
                    String(
                        general.genre ||
                        character.genre ||
                        ""
                    );

                const lowercaseGenre =
                    genre.toLowerCase();

                const nameMatches =
                    name.includes(
                        searchText
                    );

                const tagMatches =
                    lowercaseTags.some(
                        function (tag) {
                            return tag.includes(
                                searchText
                            );
                        }
                    );


                const genreTextMatches =
                    lowercaseGenre.includes(
                        searchText
                    );

                const textMatches =
                    searchText === "" ||
                    nameMatches ||
                    tagMatches ||
                    genreTextMatches;

                const genreMatches =
                    selectedGenre === "" ||
                    genre === selectedGenre;

                return (
                    textMatches &&
                    genreMatches
                );
            }
        );


    // ==================================
    // SORT BY CHARACTER NAME
    // ==================================
    filtered.sort(
        function (a, b) {
            const nameA =
                String(
                    a.name ||
                    ""
                ).trim();

            const nameB =
                String(
                    b.name ||
                    ""
                ).trim();

            const koreanA =
                /^[가-힣]/.test(
                    nameA
                );

            const koreanB =
                /^[가-힣]/.test(
                    nameB
                );

            // Korean names come first
            if (
                koreanA &&
                !koreanB
            ) {
                return -1;
            }

            if (
                !koreanA &&
                koreanB
            ) {
                return 1;
            }

            // Alphabetical order within
            // the same language group
            return nameA.localeCompare(
                nameB,
                koreanA ? "ko" : "en",
                {
                    sensitivity: "base"
                }
            );
        }
    );
    renderCharacters(
        filtered
    );
}


// ======================================
// RENDER CHARACTERS
// ======================================
function renderCharacters(
    characterList
) {
    characterGrid.innerHTML =
        "";
    emptyState.hidden =
        true;
    noResultsState.hidden =
        true;

    if (
        characters.length === 0
    ) {
        resultCount.textContent =
            "0개의 캐릭터";
        emptyState.hidden =
            false;

        return;
    }

    if (
        characterList.length === 0
    ) {
        resultCount.textContent =
            "0개의 검색 결과";
        noResultsState.hidden =
            false;

        return;
    }


    // ----------------------------------
    // RESULTS
    // ----------------------------------
    resultCount.textContent =
        `${characterList.length}개의 캐릭터`;

    characterList.forEach(
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
// CHARACTER CARD
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

    card.tabIndex =
        0;

    const general =
        character.general ||
        {};
    
        const imageContainer =
        document.createElement(
            "div"
        );

    imageContainer.className =
        "character-image-container";

    const profileImage =
        character.profileImageUrl ||
        character.profileImage ||
        "";

    if (profileImage) {
        const image =
            document.createElement(
                "img"
            );

        image.className =
            "character-image";

        image.src =
            profileImage;

        image.alt =
            `${
                character.name ||
                "캐릭터"
            } 프로필 이미지`;

        image.loading =
            "lazy";

        image.addEventListener(
            "error",
            function () {
                image.remove();

                addImagePlaceholder(
                    imageContainer
                );
            }
        );

        imageContainer.appendChild(
            image
        );

    }

    else {
        addImagePlaceholder(
            imageContainer
        );
    }

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "character-content";

    const name =
        document.createElement(
            "h2"
        );

    name.className =
        "character-name";

    name.textContent =
        character.name ||
        "이름 없음";

    const description =
        document.createElement(
            "p"
        );

    description.className =
        "character-description";

    description.textContent =

        character.shortDescription ||
        character.description ||
        character.oneLineDescription ||
        character.summary ||
        "한줄설명이 없습니다.";

    const meta =
        document.createElement(
            "div"
        );
    meta.className =
        "character-meta";

    const characterGenre =
        general.genre ||
        character.genre ||
        "";

    if (characterGenre) {
        const genreBadge =
            document.createElement(
                "span"
            );

        genreBadge.className =
            "genre-badge";

        genreBadge.textContent =
            characterGenre;

        meta.appendChild(
            genreBadge
        );
    }

    const tags =
        normalizeTags(

            general.tags

            ||

            character.tags

        );

    tags
        .slice(
            0, 3
        )
        .forEach(
            function (tag) {
                const tagBadge =
                    document.createElement(
                        "span"
                    );

                tagBadge.className =
                    "tag-badge";

                tagBadge.textContent =
                    `#${tag}`;

                meta.appendChild(
                    tagBadge
                );
            }
        );

    content.appendChild(
        name
    );

    content.appendChild(
        description
    );

    content.appendChild(
        meta
    );

    card.appendChild(
        imageContainer
    );

    card.appendChild(
        content
    );

    card.addEventListener(
        "click",
        function () {
            openCharacter(
                character.id
            );
        }
    );

    // Keyboard support
    card.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key ===
                "Enter" ||
                event.key ===
                " "
            ) {
                event.preventDefault();
                openCharacter(
                    character.id
                );
            }
        }
    );

    return card;
}


// ======================================
// IMAGE PLACEHOLDER
// ======================================
function addImagePlaceholder(
    container
) {
    const placeholder =
        document.createElement(
            "div"
        );

    placeholder.className =
        "character-no-image";
    placeholder.textContent =
        "♡";

    container.appendChild(
        placeholder
    );
}


// ======================================
// NORMALIZE TAGS
// ======================================
function normalizeTags(
    tags
) {
    if (
        Array.isArray(
            tags
        )
    ) {
        return tags
            .map(
                function (tag) {
                    return String(
                        tag
                    ).trim();
                }
            )
            .filter(
                Boolean
            );
    }

    if (
        typeof tags ===
        "string"
    ) {
        return tags
            .split(",")
            .map(
                function (tag) {
                    return tag.trim();
                }
            )

            .filter(
                Boolean
            );
    }

    return [];
}


// ======================================
// OPEN CHARACTER PAGE
// ======================================
function openCharacter(
    characterId
) {
    window.location.href =
        "character.html?id=" +
        encodeURIComponent(
            characterId
        );
}


// ======================================
// SEARCH INPUT
// ======================================
searchInput.addEventListener(
    "input",
    function () {
        updateClearButton();
        filterCharacters();
    }
);


// ======================================
// GENRE
// ======================================
genreFilter.addEventListener(
    "change",
    function () {
        filterCharacters();
    }
);


// ======================================
// CLEAR SEARCH
// ======================================
clearSearchButton.addEventListener(
    "click",
    function () {
        searchInput.value =
            "";

        updateClearButton();
        filterCharacters();
        searchInput.focus();
    }
);


// ======================================
// CLEAR BUTTON VISIBILITY
// ======================================
function updateClearButton() {
    clearSearchButton.hidden =
        searchInput.value.length === 0;
}


// ======================================
// RESET FILTER
// ======================================
function resetFilters() {
    searchInput.value =
        "";
    genreFilter.value =
        "";

    updateClearButton();
    filterCharacters();
}

resetFilterButton.addEventListener(
    "click",
    resetFilters
);

noResultsResetButton.addEventListener(
    "click",
    resetFilters
);


// ======================================
// LOADING
// ======================================
function showLoading() {
    loadingState.hidden =
        false;
    emptyState.hidden =
        true;
    noResultsState.hidden =
        true;
    characterGrid.innerHTML =
        "";
}


function hideLoading() {
    loadingState.hidden =
        true;
}


// ======================================
// INITIAL STATE
// ======================================
updateClearButton();