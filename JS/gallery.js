
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

     // Science Fiction
     "sf": "scifi",
     "scifi": "scifi",
     "sciencefiction": "scifi",
     "공상과학": "scifi",
     "에스에프": "scifi",

     // Fantasy
     "fantasy": "fantasy",
     "판타지": "fantasy",

     // History
     "history": "history",
     "historical": "history",
     "historicalfiction": "history",
     "역사": "history",
     "시대극": "history",

     // Romance
     "romance": "romance",
     "로맨스": "romance",

     // Modern Fantasy
     "modernfantasy": "modern-fantasy",
     "modfan": "modern-fantasy",
     "현대판타지": "modern-fantasy",
     "현판": "modern-fantasy",

     // Daily Life
     "daily": "daily",
     "dailylife": "daily",
     "sliceoflife": "daily",
     "일상": "daily",
     "일상물": "daily",

     // Mystery
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
         .replace(/[^a-z0-9가-힣]/g, "");

     return genreAliases[normalized] || null;

 }


 // ======================================
 // COLLECT GENRE VALUES
 // ======================================

 function collectGenres(value, genres) {

     if (value === null || value === undefined) {

         return;

     }


     // ==================================
     // ARRAY FORMAT
     // ==================================

     if (Array.isArray(value)) {

         value.forEach(function (item) {

             collectGenres(
                 item,
                 genres
             );

         });

         return;

     }


     // ==================================
     // STRING FORMAT
     // ==================================

     if (typeof value === "string") {

         const names = value.split(
             /[,/|;#&]+/
         );

         names.forEach(function (name) {

             const genre =
                 normalizeGenre(name);

             if (genre) {

                 genres.add(genre);

             }

         });

         return;

     }


     // ==================================
     // OBJECT FORMAT
     // ==================================

     if (typeof value === "object") {

         const properties = [
             "name",
             "label",
             "value",
             "id",
             "key",
             "text",
             "type",
             "genre",
             "genres",
             "tags"
         ];


         // Check common genre properties

         properties.forEach(function (property) {

             if (value[property] !== undefined) {

                 collectGenres(
                     value[property],
                     genres
                 );

             }

         });


         // Handle objects such as:
         // { fantasy: true, romance: true }

         Object.entries(value).forEach(
             function ([key, fieldValue]) {

                 if (fieldValue === true) {

                     collectGenres(
                         key,
                         genres
                     );

                 }

             }
         );

     }

 }


 // ======================================
 // GET CHARACTER GENRES
 // ======================================

 function getCharacterGenres(character) {

     const genres = new Set();


     // Check common Firestore field names

     const fields = [
         character.genre,
         character.genres,
         character.genreTags,
         character.tags,
         character.category,
         character.categories,
         character.characterGenre,
         character.characterGenres,
         character.selectedGenre,
         character.selectedGenres
     ];


     // Check nested character information

     const nestedFields = [
         character.basicInfo,
         character.characterInfo,
         character.characterData,
         character.details
     ];


     nestedFields.forEach(function (data) {

         if (
             !data ||
             typeof data !== "object"
         ) {

             return;

         }

         fields.push(
             data.genre,
             data.genres,
             data.genreTags,
             data.tags,
             data.category,
             data.categories,
             data.selectedGenres
         );

     });


     // Collect all recognized genres

     fields.forEach(function (field) {

         collectGenres(
             field,
             genres
         );

     });


     return Array.from(genres);

 }


 // ======================================
 // GET IMAGE URL
 // ======================================

 function getImageUrl(value) {

     if (typeof value === "string") {

         return value.trim();

     }

     if (
         value &&
         typeof value === "object"
     ) {

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

     if (
         typeof value !== "string" ||
         !value
     ) {

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

             const url =
                 getImageUrl(image);

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

     lightboxImage.src =
         image.url;

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

     const card =
         document.createElement("button");

     card.type = "button";

     card.className = "gallery-card";

     card.setAttribute(
         "aria-label",
         image.characterName + " 이미지 크게 보기"
     );


     // ==================================
     // IMAGE
     // ==================================

     const img =
         document.createElement("img");

     img.src = image.url;

     img.alt =
         image.characterName + " 이미지";

     img.loading = "lazy";

     img.decoding = "async";


     // ==================================
     // CHARACTER NAME
     // ==================================

     const caption =
         document.createElement("span");

     caption.className =
         "gallery-card-caption";

     caption.textContent =
         image.characterName;


     // ==================================
     // ASSEMBLE CARD
     // ==================================

     card.appendChild(img);

     card.appendChild(caption);


     // ==================================
     // IMAGE ERROR
     // ==================================

     img.addEventListener(
         "error",

         function () {

             card.remove();

         }
     );


     // ==================================
     // IMAGE CLICK
     // ==================================

     card.addEventListener(
         "click",

         function () {

             openImageViewer(image);

         }
     );


     return card;

 }


 // ======================================
 // RENDER GALLERY
 // ======================================

 function renderGallery() {

     galleryGrid.replaceChildren();


     // ==================================
     // LOADING
     // ==================================

     if (isLoading) {

         galleryCount.textContent =
             "이미지 불러오는 중...";

         galleryStatus.textContent =
             "갤러리를 불러오는 중입니다...";

         galleryStatus.hidden = false;

         return;

     }


     // ==================================
     // FILTER IMAGES
     // ==================================

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


     // ==================================
     // UPDATE IMAGE COUNT
     // ==================================

     galleryCount.textContent =
         `이미지 ${visibleImages.length}장`;


     // ==================================
     // EMPTY GALLERY
     // ==================================

     if (visibleImages.length === 0) {

         if (allImages.length === 0) {

             galleryStatus.textContent =
                 "아직 등록된 이미지가 없습니다. 캐릭터에 이미지를 추가해 보세요.";

         }

         else {

             galleryStatus.textContent =
                 "이 장르에 등록된 이미지가 없습니다.";

         }

         galleryStatus.hidden = false;

         return;

     }


     // ==================================
     // SHOW IMAGES
     // ==================================

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


         // Prevent displaying a previous user's data

         if (
             !auth.currentUser ||
             auth.currentUser.uid !== user.uid
         ) {

             return;

         }


         const images = [];


         // ==================================
         // PROCESS CHARACTER DOCUMENTS
         // ==================================

         snapshot.forEach(function (documentSnapshot) {

             const character =
                 documentSnapshot.data();


             // Character name

             const characterName =
                 character.name ||
                 character.characterName ||
                 character.title ||
                 "이름 없는 캐릭터";


             // Get character genres

             const genres =
                 getCharacterGenres(character);


             // Get character images

             const characterImages =
                 getCharacterImages(character);


             // ==================================
             // GENRE DEBUGGING
             // ==================================

             console.log(
                 "Character:",
                 characterName,
                 "Saved character data:",
                 character,
                 "Recognized genres:",
                 genres,
                 "Image count:",
                 characterImages.length
             );


             // ==================================
             // ADD EACH IMAGE SEPARATELY
             // ==================================

             characterImages.forEach(function (url) {

                 images.push({

                     url: url,

                     characterName: characterName,

                     genres: genres

                 });

             });

         });


         // ==================================
         // RANDOMIZE IMAGE ORDER
         // ==================================

         allImages = shuffleImages(
             images
         );


         isLoading = false;


         // ==================================
         // DISPLAY GALLERY
         // ==================================

         renderGallery();

     }


     // ==================================
     // FIRESTORE ERROR
     // ==================================

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

     button.addEventListener(
         "click",

         function () {

             const buttonGenre =
                 button.dataset.genre;


             // ==================================
             // SELECT GENRE
             // ==================================

             selectedGenre =
                 buttonGenre === "all"
                     ? "all"
                     : normalizeGenre(buttonGenre);


             if (!selectedGenre) {

                 console.warn(
                     "Unknown genre:",
                     buttonGenre
                 );

                 return;

             }


             // ==================================
             // UPDATE ACTIVE BUTTON
             // ==================================

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


             // ==================================
             // DEBUG FILTER
             // ==================================

             console.log(
                 "Selected genre:",
                 selectedGenre
             );


             // ==================================
             // RENDER FILTERED IMAGES
             // ==================================

             renderGallery();

         }
     );

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


 // ======================================
 // CLICK OUTSIDE IMAGE
 // ======================================

 imageDialog.addEventListener(
     "click",

     function (event) {

         if (event.target === imageDialog) {

             imageDialog.close();

         }

     }
 );


 // ======================================
 // CLEAR IMAGE AFTER CLOSE
 // ======================================

 imageDialog.addEventListener(
     "close",

     function () {

         lightboxImage.removeAttribute(
             "src"
         );

     }
 );


 // ======================================
 // AUTHENTICATION CHECK
 // ======================================

 onAuthStateChanged(

     auth,

     function (user) {

         // ==================================
         // NOT LOGGED IN
         // ==================================

         if (!user) {

             allImages = [];

             window.location.replace(
                 "main.html"
             );

             return;

         }


         // ==================================
         // LOGGED IN
         // ==================================

         loadGallery(user);

     },


     // ==================================
     // AUTHENTICATION ERROR
     // ==================================

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
