// static/js/ui.js

// --- Constants ---
const catImageUrls = [ '/static/Box.png', '/static/Box2.png', '/static/Box3.png' ]; // Updated paths
const catNormalSpeed = 500;
const catFastSpeed = 150;
const SLIDESHOW_INTERVAL_MS = 5000; // 5 seconds per slide

// --- State Variables ---
let catImageIndex = 0;
let catAnimationIntervalId = null;
let isCatFast = false;
let catFastTimeoutId = null;
let slideshowTimeoutId = null;
let currentSlideIndex = 0;
let slideshowImageUrls = []; // Populated by initializeSlideshow

// --- DOM Element References (initialized in main.js) ---
// These will be assigned in main.js after DOMContentLoaded


// --- Mobile Menu ---
/**
 * Toggles the visibility of the mobile menu.
 */
function toggleMobileMenu() {
    if (mobileMenuElement) {
        const isHidden = mobileMenuElement.classList.toggle('hidden');
        if (mobileMenuButtonElement) {
            mobileMenuButtonElement.textContent = isHidden ? '\ue9af' : '\uea13'; // Menu vs X icon
            mobileMenuButtonElement.setAttribute('aria-label', isHidden ? '開啟選單' : '關閉選單');
            mobileMenuButtonElement.setAttribute('aria-expanded', !isHidden);
        }
    } else {
        console.error("Mobile menu element not found for toggle.");
    }
}

// --- Interactive Cat ---
/**
 * Stops the cat animation intervals and timeouts.
 */
function stopCatAnimation() {
    if (catAnimationIntervalId) clearInterval(catAnimationIntervalId);
    if (catFastTimeoutId) clearTimeout(catFastTimeoutId);
    catAnimationIntervalId = null;
    catFastTimeoutId = null;
    isCatFast = false;
}

/**
 * Starts the cat image cycling animation.
 * @param {number} speed - Interval speed in milliseconds.
 */
function startCatAnimation(speed) {
    stopCatAnimation(); // Clear existing animation first
    if (!interactiveCatImgElement || catImageUrls.length === 0) {
        console.warn("Cannot start cat animation: Image element or URLs missing.");
        return;
    }

    // Ensure initial image is set if needed (path is now set in HTML)
    // if (!interactiveCatImgElement.src || interactiveCatImgElement.src.startsWith('data:')) {
    //      interactiveCatImgElement.src = catImageUrls[0];
    // }

    catAnimationIntervalId = setInterval(() => {
        if (!interactiveCatImgElement) { // Check if element still exists
            stopCatAnimation();
            return;
        }
        catImageIndex = (catImageIndex + 1) % catImageUrls.length;
        interactiveCatImgElement.src = catImageUrls[catImageIndex]; // Assumes paths are correct
    }, speed);
}

/**
 * Handles clicks on the interactive cat element.
 */
function handleCatClick() {
    if (!interactiveCatContainerElement || !interactiveCatImgElement) {
         console.warn("Cannot handle cat click: Container or image element missing.");
        return;
    }
    if (isCatFast) return; // Ignore clicks if already in fast mode

    isCatFast = true;
    startCatAnimation(catFastSpeed); // Start fast animation
    catFastTimeoutId = setTimeout(() => {
        isCatFast = false;
        // Check if element still exists before restarting animation
        if (interactiveCatImgElement) {
            startCatAnimation(catNormalSpeed); // Return to normal speed
        }
    }, 2000); // Fast animation duration
}

// --- Particles.js ---
/**
 * Initializes the Particles.js animation.
 */
function initParticles() {
    if (typeof particlesJS === 'undefined') {
        console.error('particles.js library not loaded.');
        // Maybe add a fallback background or style?
        return;
    }
    if (!particlesJsElement) {
         console.error("Particles.js container element (#particles-js) missing.");
         return;
    }
     console.log("Initializing Particles.js");
     try {
         particlesJS("particles-js", { /* Particle config from previous state */
           "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#888888", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true
         });
     } catch (e) {
         console.error("Error initializing particles.js:", e);
     }
}

// --- Hero Slideshow ---

/**
 * Clears existing slides and stops the slideshow timer.
 */
function clearSlideshow() {
    if (slideshowTimeoutId) clearTimeout(slideshowTimeoutId);
    slideshowTimeoutId = null;
    if (heroSlideshowElement) heroSlideshowElement.innerHTML = ''; // Clear content
    currentSlideIndex = 0;
    console.log("Slideshow cleared.");
}

/**
 * Creates and appends slide elements to the slideshow container.
 */
function populateSlideshow() {
    clearSlideshow();

    if (!heroSlideshowElement) {
        console.error("Cannot populate slideshow: container element missing.");
        return;
    }
     // Ensure placeholder exists if needed (it's defined in HTML now)
     slideshowPlaceholder = document.getElementById('slideshow-placeholder');

    if (slideshowImageUrls.length === 0) {
        console.warn("No images available for slideshow.");
        if (slideshowPlaceholder) {
            heroSlideshowElement.appendChild(slideshowPlaceholder); // Show placeholder
             slideshowPlaceholder.textContent = "暫無分享圖片"; // Update text
        } else {
            heroSlideshowElement.innerHTML = '<div id="slideshow-placeholder">暫無分享圖片</div>';
        }
        return;
    }

     if (slideshowPlaceholder && slideshowPlaceholder.parentNode === heroSlideshowElement) {
        heroSlideshowElement.removeChild(slideshowPlaceholder); // Remove placeholder
    }

    console.log(`Populating slideshow with ${slideshowImageUrls.length} images.`);
    slideshowImageUrls.forEach((imageUrl, index) => {
        if (!imageUrl) return; // Skip if URL is somehow invalid

        const slideDiv = document.createElement('div');
        slideDiv.className = 'slide';
        if (index === 0) slideDiv.classList.add('active'); // Activate first slide

        const img = document.createElement('img');
         // Ensure utils.js escapeHTML is available
        img.src = typeof escapeHTML === 'function' ? escapeHTML(imageUrl) : imageUrl;
        img.alt = `習慣養成分享 ${index + 1}`;
        img.loading = (index === 0) ? 'eager' : 'lazy'; // Load first image eagerly

        // Ensure utils.js handleImageError is available
        img.onerror = function() { if(typeof handleImageError === 'function') handleImageError(this, '輪播圖片載入失敗'); };

        slideDiv.appendChild(img);
        heroSlideshowElement.appendChild(slideDiv);
    });

    // Start the automatic rotation only if there's more than one slide
    if (slideshowImageUrls.length > 1) {
        startSlideshowTimer();
    }
}

/**
 * Starts the automatic slideshow rotation timer.
 */
function startSlideshowTimer() {
     if (slideshowTimeoutId) clearTimeout(slideshowTimeoutId); // Clear existing timer if any
     if (slideshowImageUrls.length <= 1) return; // Don't start timer for 0 or 1 slide

     slideshowTimeoutId = setTimeout(nextSlide, SLIDESHOW_INTERVAL_MS);
     console.log(`Slideshow timer started for next slide in ${SLIDESHOW_INTERVAL_MS / 1000}s.`);
}

/**
 * Advances the slideshow to the next slide. Handles transition.
 */
function nextSlide() {
    if (!heroSlideshowElement || slideshowImageUrls.length <= 1) {
         console.log("Slideshow rotation stopped or not needed.");
        return;
    }

    const slides = heroSlideshowElement.querySelectorAll('.slide');
    if (slides.length !== slideshowImageUrls.length || slides.length === 0) {
         console.error("Slide count mismatch or no slides found. Stopping slideshow.");
        clearSlideshow();
        // Maybe try re-initializing?
        // initializeSlideshow();
        return;
    }


    // Remove 'active' from current slide
     if (slides[currentSlideIndex]) {
         slides[currentSlideIndex].classList.remove('active');
     } else {
         console.warn(`Current slide index ${currentSlideIndex} out of bounds.`);
         currentSlideIndex = 0; // Reset index
     }


    // Calculate next index
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;

    // Add 'active' to the new current slide
    if (slides[currentSlideIndex]) {
         slides[currentSlideIndex].classList.add('active');
    } else {
         console.error(`Next slide index ${currentSlideIndex} out of bounds.`);
         // Attempt to recover or stop
         clearSlideshow();
         return;
    }


    // Set timer for the next transition
    startSlideshowTimer();
}


/**
 * Initializes the slideshow. Assumes `currentWorksData` is populated by gallery.js.
 * Uses the first few scorecard images for the slideshow.
 */
function initializeSlideshow() {
    if (!heroSlideshowElement) {
         console.error("Cannot initialize slideshow: container element missing.");
        return;
    }
    slideshowPlaceholder = document.getElementById('slideshow-placeholder'); // Find placeholder

    // Use data fetched by gallery.js (stored in currentWorksData)
    // Ensure currentWorksData is defined (might need loading indicator or promise)
    if (!currentWorksData || typeof currentWorksData === 'undefined') {
        console.warn("Slideshow initialization deferred: waiting for gallery data (currentWorksData).");
        // Retry after a short delay - this is a simple polling mechanism
        setTimeout(initializeSlideshow, 1500);
        return;
    }

    console.log("Initializing slideshow with data...");

    try {
        // Extract scorecard image URLs from the latest works (adjust slice as needed)
        slideshowImageUrls = currentWorksData
                                .slice(0, 5) // Get up to 5 works
                                .map(work => work.scorecardImageUrl) // Get the scorecard URL
                                .filter(url => url && typeof url === 'string'); // Ensure URL exists and is a string

        console.log("Extracted Slideshow Image URLs:", slideshowImageUrls);
        populateSlideshow();

    } catch (error) {
        console.error("無法初始化幻燈片資料:", error);
        slideshowImageUrls = []; // Reset on error
        populateSlideshow(); // Show placeholder if error occurs
    }
}


// --- Smooth Scrolling ---
/**
 * Handles clicks on anchor links for smooth scrolling.
 * @param {Event} e - The click event.
 */
function handleSmoothScroll(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    // Basic check for valid target ID selector
    if (!targetId || targetId === "#" || !targetId.startsWith('#') || targetId.length === 1) return;

    e.preventDefault(); // Prevent default jump only if it's a valid internal link

    try {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Close mobile menu if needed
            if (mobileMenuElement && !mobileMenuElement.classList.contains('hidden') && mobileMenuElement.contains(link)) {
                toggleMobileMenu();
            }
        } else {
            console.warn(`Smooth scroll target element not found: ${targetId}`);
        }
    } catch (error) {
        // Catch potential errors from invalid selectors passed to querySelector
        console.error(`Error finding or scrolling to element '${targetId}':`, error);
    }
}