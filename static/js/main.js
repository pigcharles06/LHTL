// static/js/main.js
// This script ties everything together and should be loaded last (using defer).

// Assign variables that are used across different modules.
// Note: In a module system, these would be imported/exported.
// Here, they rely on being assigned before functions in other files need them.
let workGalleryElement = null;
let uploadForm = null;
let authorNameInput = null;
let scorecardImageInput = null;
let comicImageInput = null;
let currentHabitsInput = null;
let reflectionInput = null;
let uploadStatusElement = null;
let modalElement = null;
let modalCloseButton = null;
let modalAuthor = null;
let modalCurrentHabits = null;
let modalReflection = null;
let modalScorecardImage = null;
let modalComicImage = null;
let mobileMenuButtonElement = null;
let mobileMenuElement = null;
let interactiveCatContainerElement = null;
let interactiveCatImgElement = null;
let particlesJsElement = null;
let heroSlideshowElement = null;


// Wait for the DOM to be fully loaded before running setup
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing application...");

    // --- Assign DOM Elements ---
    // Use a helper function for robustness
    const getElement = (id) => {
        const el = document.getElementById(id);
        if (!el) console.warn(`Element with ID '${id}' not found.`);
        return el;
    };

    // Gallery & Form Elements (for gallery.js)
    workGalleryElement = getElement('work-gallery');
    uploadForm = getElement('upload-form');
    authorNameInput = getElement('author-name');
    scorecardImageInput = getElement('scorecard-image');
    comicImageInput = getElement('comic-image');
    currentHabitsInput = getElement('current-habits');
    reflectionInput = getElement('reflection');
    uploadStatusElement = getElement('upload-status');

    // Modal Elements (for gallery.js)
    modalElement = getElement('work-modal');
    modalCloseButton = modalElement?.querySelector('.modal-close'); // Query within modal
    modalAuthor = getElement('modal-author');
    modalCurrentHabits = getElement('modal-current-habits');
    modalReflection = getElement('modal-reflection');
    modalScorecardImage = getElement('modal-scorecard-image');
    modalComicImage = getElement('modal-comic-image');

    // UI Elements (for ui.js)
    mobileMenuButtonElement = getElement('mobile-menu-button');
    mobileMenuElement = getElement('mobile-menu');
    interactiveCatContainerElement = getElement('interactive-cat-container');
    interactiveCatImgElement = getElement('interactive-cat-img');
    particlesJsElement = getElement('particles-js');
    heroSlideshowElement = getElement('hero-slideshow');

    // --- Check if critical elements are missing ---
     if (!workGalleryElement || !uploadForm || !modalElement || !heroSlideshowElement) {
         console.error("Core layout elements missing (gallery, form, modal, slideshow). Functionality will be limited.");
         // Display a more prominent error?
         // return; // Optionally stop execution
     }


    // --- Initialize Page Components ---
    // Use a structured approach, ensuring dependencies are met
    async function initializePage() {
        console.log("main.js: Initializing page components...");

        // Initialize non-data-dependent UI first
        if (typeof initParticles === 'function') initParticles(); else console.error("initParticles not found.");
        if (typeof startCatAnimation === 'function' && interactiveCatImgElement) startCatAnimation(catNormalSpeed); else console.error("startCatAnimation not found or cat image missing.");
        if (typeof startKeepAliveTimer === 'function') startKeepAliveTimer(); else console.error("startKeepAliveTimer not found.");

         // Initialize gallery (fetches data)
         if (typeof loadAndRenderWorks === 'function') {
             try {
                 await loadAndRenderWorks(); // Wait for gallery data to load
                 console.log("Gallery loaded. Initializing slideshow...");
                 // Initialize slideshow (depends on gallery data via currentWorksData)
                 if (typeof initializeSlideshow === 'function') {
                    initializeSlideshow();
                 } else {
                    console.error("initializeSlideshow not found.");
                 }
             } catch(galleryError) {
                 console.error("Error loading gallery, slideshow might not initialize correctly:", galleryError);
                 // Still try to initialize slideshow (it might handle empty data)
                  if (typeof initializeSlideshow === 'function') initializeSlideshow();
             }
         } else {
             console.error("loadAndRenderWorks function not found.");
             // If gallery can't load, should slideshow still try? Maybe not.
              if (typeof initializeSlideshow === 'function') initializeSlideshow(); // Try anyway, might show placeholder
         }

         // Set up error handling for static images after DOM is ready
         document.querySelectorAll('img').forEach(img => {
              // Add handler only if it doesn't have one and the function exists
              if (!img.onerror && typeof handleImageError === 'function') {
                  // Avoid overriding specific handlers if already set (like cat maybe)
                  if(img.id !== 'interactive-cat-img') { // Simple check
                      img.onerror = function() { handleImageError(this, '圖片載入失敗'); };
                  }
              }
         });


        console.log("main.js: Page initialization sequence complete.");
    }

    initializePage(); // Start the process


    // --- Bind Event Listeners ---
    console.log("main.js: Binding event listeners...");

    // Upload Form
    if (uploadForm && typeof handleWorkUpload === 'function') {
        uploadForm.addEventListener('submit', handleWorkUpload);
        console.log("Submit listener bound for upload form.");
    } else {
         console.warn("Upload form or handler not found. Uploads disabled.");
    }

    // Mobile Menu Button
    if (mobileMenuButtonElement && typeof toggleMobileMenu === 'function') {
        mobileMenuButtonElement.addEventListener('click', toggleMobileMenu);
         console.log("Click listener bound for mobile menu button.");
    } else {
         console.warn("Mobile menu button or handler not found.");
    }

    // Interactive Cat
    if (interactiveCatContainerElement && typeof handleCatClick === 'function') {
        interactiveCatContainerElement.addEventListener('click', handleCatClick);
        console.log("Click listener bound for interactive cat.");
    } else {
         console.warn("Interactive cat container or handler not found.");
    }

    // Smooth Scrolling (Delegate from body)
    if (typeof handleSmoothScroll === 'function') {
        document.body.addEventListener('click', (event) => {
            // Check if the click originated from within an appropriate anchor
            if (event.target.closest('a[href^="#"]')) {
                handleSmoothScroll(event);
            }
        });
        console.log("Click listener bound for smooth scrolling (delegated).");
    } else {
        console.warn("handleSmoothScroll function not found.");
    }

    // Modal Close Mechanisms
    if (modalElement && typeof closeWorkModal === 'function') {
        // Close button
        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', closeWorkModal);
            console.log("Click listener bound for modal close button.");
        } else {
             console.warn("Modal close button element not found.");
        }
        // Click outside modal content
        modalElement.addEventListener('click', (event) => {
            if (event.target === modalElement) { // Clicked on the background overlay
                closeWorkModal();
            }
        });
         console.log("Click listener bound for modal background.");
         // Close on Escape key
         window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modalElement.style.display === 'block') {
                closeWorkModal();
            }
        });
         console.log("Keydown listener bound for modal Escape key.");

    } else {
        console.warn("Modal element or close function not found. Modal interactions disabled.");
    }

    console.log("main.js: Event listeners bound.");

}); // End of DOMContentLoaded listener