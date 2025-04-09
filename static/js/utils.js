// js/utils.js

/**
 * Handles image loading errors by replacing the source with a placeholder SVG.
 * @param {HTMLImageElement} imgElement - The image element that failed to load.
 * @param {string} [errorText='圖片載入失敗'] - Text to display on the placeholder.
 */
function handleImageError(imgElement, errorText = '圖片載入失敗') {
    console.error(`圖片載入失敗: ${imgElement.src}, Alt: ${imgElement.alt}`);
    imgElement.onerror = null; // Prevent infinite loop if placeholder itself fails
    const defaultSize = 200;
    const size = imgElement.id === 'interactive-cat-img' ? 80 : defaultSize;
    // Use an embedded SVG placeholder for reliability
    const placeholderSvg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
            <rect width='100%' height='100%' fill='%23cccccc'/>
            <text x='50%' y='50%' font-family='sans-serif' font-size='14px' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>
                ${escapeHTML(errorText)}
            </text>
        </svg>`;
    imgElement.src = `data:image/svg+xml,${encodeURIComponent(placeholderSvg)}`;
    imgElement.alt = errorText;
}

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;' // Use HTML entity for single quote
    }[tag] || tag));
}

// If you plan to use ES Modules in the future, you would add:
// export { handleImageError, escapeHTML };