// js/ui.js

// --- Constants ---
const catImageUrls = [ '/static/Box.png', '/static/Box2.png', '/static/Box3.png' ]; // Ensure these images are accessible
const catNormalSpeed = 500;
const catFastSpeed = 150;

// --- State Variables (scoped to this UI module) ---
let catImageIndex = 0;
let catAnimationIntervalId = null;
let isCatFast = false;
let catFastTimeoutId = null;

// --- DOM Element References (initialized in main.js) ---
let mobileMenuButtonElement = null;
let mobileMenuElement = null;
let interactiveCatContainerElement = null;
let interactiveCatImgElement = null;
let particlesJsElement = null;

// --- Mobile Menu ---
/**
 * Toggles the visibility of the mobile menu.
 */
function toggleMobileMenu() {
    if (mobileMenuElement) {
        mobileMenuElement.classList.toggle('hidden');
        // Optional: Change button icon based on state
        if (mobileMenuButtonElement) {
            mobileMenuButtonElement.textContent = mobileMenuElement.classList.contains('hidden') ? '\ue9af' : '\uea13'; // Menu vs X icon (Lucide characters)
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
    if (catAnimationIntervalId) {
        clearInterval(catAnimationIntervalId);
        catAnimationIntervalId = null;
    }
    if (catFastTimeoutId) {
        clearTimeout(catFastTimeoutId);
        catFastTimeoutId = null;
    }
    isCatFast = false; // Reset state
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

    // Ensure the first image is loaded correctly
    if (!interactiveCatImgElement.src || interactiveCatImgElement.src.startsWith('data:')) {
         interactiveCatImgElement.src = catImageUrls[0];
    }

    catAnimationIntervalId = setInterval(() => {
        catImageIndex = (catImageIndex + 1) % catImageUrls.length;
        interactiveCatImgElement.src = catImageUrls[catImageIndex];
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

    if (!isCatFast) {
        isCatFast = true;
        startCatAnimation(catFastSpeed); // Start fast animation
        // Set timeout to return to normal speed
        catFastTimeoutId = setTimeout(() => {
            isCatFast = false;
            startCatAnimation(catNormalSpeed); // Return to normal speed
        }, 2000); // Fast animation duration (2 seconds)
    }
    // If already fast, clicking again does nothing until timeout resets it
}

// --- Particles.js ---
/**
 * Initializes the Particles.js animation.
 */
function initParticles() {
    if (typeof particlesJS === 'undefined') {
        console.error('particles.js library not loaded. Make sure the CDN script is included in HTML.');
        return;
    }
    if (particlesJsElement) {
        console.log("Initializing Particles.js");
        // Using the same config as before
        particlesJS("particles-js", {
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#888888", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true
        });
    } else {
        console.error("Particles.js container element (#particles-js) missing.");
    }
}


// --- Smooth Scrolling --- (Can be handled by CSS `scroll-behavior: smooth;` but JS provides fallback/more control if needed)
/**
 * Handles clicks on anchor links for smooth scrolling.
 * @param {Event} e - The click event.
 */
function handleSmoothScroll(e) {
    const link = e.target.closest('a[href^="#"]'); // Find the anchor link
    if (!link) return;

    e.preventDefault();
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === "#") return; // Ignore empty or "#" links

    try {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Close mobile menu if a link inside it is clicked
            if (mobileMenuElement && !mobileMenuElement.classList.contains('hidden') && mobileMenuElement.contains(link)) {
                toggleMobileMenu(); // Call the function to toggle
            }
        } else {
            console.warn(`Smooth scroll target not found: ${targetId}`);
        }
    } catch (error) {
        console.error(`Invalid selector or error scrolling to '${targetId}':`, error);
    }
}

// Export functions if using modules
// export { toggleMobileMenu, startCatAnimation, stopCatAnimation, handleCatClick, initParticles, handleSmoothScroll };