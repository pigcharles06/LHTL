// js/gallery.js

// Assumes utils.js is loaded first, or uses modules

// --- Constants ---
const MAX_DESC_LENGTH = 500; // Corresponds to textarea maxlength

// --- DOM Element References (initialized in main.js) ---
let workGalleryElement = null;
let galleryPlaceholder = null;
let uploadForm = null;
let workImageInput = null;
let workDescriptionInput = null;
let uploadStatusElement = null;

/**
 * Fetches works data from the backend API and renders them in the gallery.
 */
async function loadAndRenderWorks() {
    if (!workGalleryElement) {
        console.error("loadAndRenderWorks: Gallery element not found (maybe main.js hasn't run yet?)");
        return;
    }
    console.log("Fetching works from backend via /works...");
    workGalleryElement.innerHTML = `<p id="gallery-placeholder" class="text-center text-gray-500 col-span-full">正在載入作品...</p>`; // Show loading state

    try {
        const response = await fetch('/works'); // Relative URL works when served by Flask
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMsg = `伺服器錯誤: ${errorData.error}`;
                }
            } catch (jsonError) { /* Ignore if response isn't JSON */ }
            throw new Error(errorMsg);
        }

        const works = await response.json();
        console.log("Received works data:", works);

        workGalleryElement.innerHTML = ''; // Clear loading/previous state

        if (!Array.isArray(works)) {
            throw new Error("從伺服器收到的資料格式不正確。");
        }

        if (works.length === 0) {
            workGalleryElement.innerHTML = `<p id="gallery-placeholder" class="text-center text-gray-500 col-span-full">目前還沒有人上傳作品喔！快來成為第一位吧！</p>`;
            return;
        }

        // Render each work card
        works.forEach(work => {
            if (!work || typeof work.imageUrl !== 'string' || typeof work.description !== 'string') {
                console.warn("Skipping invalid work data:", work);
                return;
            }

            const card = document.createElement('div');
            card.className = 'work-card fade-in';
            const escapedImageUrl = escapeHTML(work.imageUrl);
            const escapedDescription = escapeHTML(work.description);

            card.innerHTML = `
                <img src="${escapedImageUrl}" alt="學生作品" loading="lazy">
                <p>${escapedDescription}</p>
            `;
            const imgElement = card.querySelector('img');
            if (imgElement) {
                 // Use handleImageError from utils.js (assuming it's globally available)
                imgElement.onerror = function() { handleImageError(this, `作品圖片載入失敗`); };
            } else {
                console.error("無法為卡片找到圖片元素:", card);
            }
            workGalleryElement.appendChild(card);
        });

    } catch (error) {
        console.error("無法載入作品:", error);
        if (workGalleryElement) { // Check again in case it became null
            workGalleryElement.innerHTML = `<p id="gallery-placeholder" class="text-center text-red-600 col-span-full">載入作品時發生錯誤：${escapeHTML(error.message)}</p>`;
        }
    }
}

/**
 * Handles the submission of the work upload form.
 * @param {Event} event - The form submission event.
 */
async function handleWorkUpload(event) {
    event.preventDefault(); // Prevent default form submission

    // Ensure elements are available
    if (!workImageInput || !workDescriptionInput || !uploadForm || !uploadStatusElement) {
        console.error("Upload form elements not found during submit.");
        alert("頁面載入似乎不完整，無法上傳，請嘗試重新整理。");
        return;
    }

    const imageFile = workImageInput.files[0];
    const description = workDescriptionInput.value.trim();
    const submitButton = uploadForm.querySelector('button[type="submit"]');

    // Clear previous status messages
    uploadStatusElement.textContent = '';
    uploadStatusElement.className = 'mt-4 text-center text-sm'; // Reset classes

    // --- Frontend Validation ---
    if (!imageFile) {
        uploadStatusElement.textContent = '請選擇要上傳的圖片檔案！';
        uploadStatusElement.classList.add('text-red-600');
        return;
    }
    if (!description) {
        uploadStatusElement.textContent = '請輸入作品介紹！';
        uploadStatusElement.classList.add('text-red-600');
        return;
    }
    if (description.length > MAX_DESC_LENGTH) {
        uploadStatusElement.textContent = `作品介紹過長，請勿超過 ${MAX_DESC_LENGTH} 字。`;
        uploadStatusElement.classList.add('text-red-600');
        return;
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
        uploadStatusElement.textContent = '不支援的圖片格式。請選擇 PNG, JPG, 或 GIF。';
        uploadStatusElement.classList.add('text-red-600');
        return;
    }
    const maxSize = 16 * 1024 * 1024; // 16MB limit
    if (imageFile.size > maxSize) {
        uploadStatusElement.textContent = `檔案大小超過限制 (最大 ${maxSize / 1024 / 1024}MB)。`;
        uploadStatusElement.classList.add('text-red-600');
        return;
    }
    // --- End Validation ---

    const formData = new FormData();
    formData.append('work-image', imageFile);
    formData.append('work-description', description);

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '上傳中...';
    }
    uploadStatusElement.textContent = '正在上傳作品...';
    uploadStatusElement.classList.add('text-blue-600');

    try {
        const response = await fetch('/upload', { // Relative URL
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (response.ok && result.success) {
            uploadStatusElement.textContent = '作品上傳成功！畫廊正在更新...';
            uploadStatusElement.classList.remove('text-red-600', 'text-blue-600');
            uploadStatusElement.classList.add('text-green-600');
            if (uploadForm) uploadForm.reset();
            await loadAndRenderWorks(); // Refresh gallery
            setTimeout(() => { if (uploadStatusElement) uploadStatusElement.textContent = ''; }, 5000); // Clear success message
        } else {
            const errorMsg = result.error || '發生未知錯誤';
            uploadStatusElement.textContent = `上傳失敗: ${escapeHTML(errorMsg)}`; // Use escapeHTML from utils.js
            uploadStatusElement.classList.remove('text-blue-600', 'text-green-600');
            uploadStatusElement.classList.add('text-red-600');
            console.error("Upload failed:", result);
        }
    } catch (error) {
        uploadStatusElement.textContent = '上傳過程中發生網路或伺服器連線錯誤。';
        uploadStatusElement.classList.remove('text-blue-600', 'text-green-600');
        uploadStatusElement.classList.add('text-red-600');
        console.error("Error during fetch /upload:", error);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '確認上傳';
        }
    }
}

// Export functions if using modules
// export { loadAndRenderWorks, handleWorkUpload };