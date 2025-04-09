// js/main.js
// This script should be loaded last or use 'defer'. It coordinates other scripts.

// --- Global DOM Element Variables ---
// (Declared globally within gallery.js and ui.js, but assigned here)

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing page...");

    // --- Assign DOM Elements to Module Variables ---
    // Gallery elements
    workGalleryElement = document.getElementById('work-gallery');
    galleryPlaceholder = document.getElementById('gallery-placeholder'); // Can be null if dynamic
    uploadForm = document.getElementById('upload-form');
    workImageInput = document.getElementById('work-image');
    workDescriptionInput = document.getElementById('work-description');
    uploadStatusElement = document.getElementById('upload-status');

    // UI elements
    mobileMenuButtonElement = document.getElementById('mobile-menu-button');
    mobileMenuElement = document.getElementById('mobile-menu');
    interactiveCatContainerElement = document.getElementById('interactive-cat-container');
    interactiveCatImgElement = document.getElementById('interactive-cat-img');
    particlesJsElement = document.getElementById('particles-js');

    // Check if critical elements were found
    if (!workGalleryElement || !uploadForm || !workImageInput || !workDescriptionInput || !uploadStatusElement) {
        console.error("一個或多個主要應用程式 DOM 元素未找到。頁面功能可能受影響。");
        // Display a user-friendly error message?
        const body = document.querySelector('body');
        if (body && !document.getElementById('init-error-msg')) { // Prevent duplicate messages
            const errorDiv = document.createElement('div');
            errorDiv.id = 'init-error-msg';
            errorDiv.textContent = '頁面部分元件載入失敗，部分功能可能無法使用。請嘗試重新整理頁面。';
            errorDiv.style.color = 'white';
            errorDiv.style.backgroundColor = 'red';
            errorDiv.style.padding = '1em';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '0';
            errorDiv.style.left = '0';
            errorDiv.style.width = '100%';
            errorDiv.style.zIndex = '1000';
            body.prepend(errorDiv); // Add to the top
        }
        // Decide whether to proceed or stop initialization
        // return; // Uncomment to stop if critical elements are missing
    }

    // --- Initialize Page Components ---
    function initializePage() {
        console.log("main.js: Initializing page components...");

        // 1. Load gallery content (from gallery.js)
        // Make sure loadAndRenderWorks is available (script loaded)
        if (typeof loadAndRenderWorks === 'function') {
            loadAndRenderWorks();
        } else {
            console.error("loadAndRenderWorks function not found.");
        }

        // 2. Initialize interactive cat (from ui.js)
        if (interactiveCatImgElement) {
            if (typeof handleImageError === 'function') { // Check if util function exists
                 interactiveCatImgElement.onerror = function() { handleImageError(this, 'Cat Error'); };
            }
            if (!interactiveCatImgElement.getAttribute('src')) {
                interactiveCatImgElement.src = catImageUrls[0] || ''; // Use constant from ui.js? (Need module system or global)
            }
            if (typeof startCatAnimation === 'function') { // Check if ui function exists
                startCatAnimation(catNormalSpeed); // Use constants from ui.js scope ideally
            } else {
                 console.error("startCatAnimation function not found.");
            }
        } else {
            console.warn("互動小貓圖片元素未找到。");
        }

        // 3. Initialize particles (from ui.js)
        if (particlesJsElement) {
             if (typeof initParticles === 'function') { // Check if ui function exists
                initParticles();
             } else {
                  console.error("initParticles function not found.");
             }
        } else {
            console.warn("Particles.js 容器元素未找到。");
        }

        // 4. Start keep-alive timer (from keep-alive.js)
         if (typeof startKeepAliveTimer === 'function') { // Check if keep-alive function exists
            startKeepAliveTimer(); // Uses default 10 minute interval
         } else {
             console.error("startKeepAliveTimer function not found.");
         }

        console.log("main.js: Page initialization complete.");
    }

    initializePage(); // Run the initialization sequence

    // --- Bind Event Listeners ---
    console.log("main.js: Binding event listeners...");

    // Upload Form Submission (uses function from gallery.js)
    if (uploadForm) {
         if (typeof handleWorkUpload === 'function') {
             uploadForm.addEventListener('submit', handleWorkUpload);
             console.log("已綁定上傳表單的 submit 事件。");
         } else {
              console.error("handleWorkUpload function not found for form listener.");
         }
    }

    // Mobile Menu Toggle Button (uses function from ui.js)
    if (mobileMenuButtonElement) {
        if (typeof toggleMobileMenu === 'function') {
            mobileMenuButtonElement.addEventListener('click', toggleMobileMenu);
            console.log("已綁定行動選單按鈕的 click 事件。");
        } else {
             console.error("toggleMobileMenu function not found for button listener.");
        }
    }

    // Interactive Cat Click (uses function from ui.js)
    if (interactiveCatContainerElement) {
         if (typeof handleCatClick === 'function') {
            interactiveCatContainerElement.addEventListener('click', handleCatClick);
            console.log("已綁定互動小貓容器的 click 事件。");
         } else {
              console.error("handleCatClick function not found for cat listener.");
         }
    }

    // Smooth Scrolling (uses function from ui.js)
    // Listen on a parent element or body for efficiency if many links
    document.body.addEventListener('click', (event) => {
         if (event.target.closest('a[href^="#"]')) { // Check if click was on or inside an anchor link
             if (typeof handleSmoothScroll === 'function') {
                 handleSmoothScroll(event);
             } else {
                  console.error("handleSmoothScroll function not found.");
             }
         }
    });
    console.log("已綁定平滑滾動事件 (監聽 body)。");


    // General Image Error Handling for static images (uses function from utils.js)
    const staticImages = document.querySelectorAll('img'); // Select all images
     staticImages.forEach(img => {
         // Add error handler only if one doesn't already exist (e.g., from gallery render)
         if (!img.onerror && typeof handleImageError === 'function') {
             // Don't necessarily overwrite cat image handler if already set
             if(img.id !== 'interactive-cat-img') {
                 img.onerror = function() { handleImageError(this, '圖片載入失敗'); };
             }
         }
     });
     console.log("已為頁面圖片嘗試綁定通用 error 事件處理。");


}); // End of DOMContentLoaded listener