// static/js/gallery.js

// --- Constants ---
const MAX_DESC_LENGTH_HABITS = 500;
const MAX_DESC_LENGTH_REFLECTION = 1000;
const MAX_AUTHOR_LENGTH = 50;

// --- DOM Element References (initialized in main.js) ---
// These will be assigned in main.js after DOMContentLoaded


// --- State ---
// Store fetched works data to populate modal without refetching
let currentWorksData = [];

// --- Modal Functions ---

/**
 * Opens the modal and populates it with data for the selected work.
 * @param {string} workId - The unique ID of the work to display.
 */
function openWorkModal(workId) {
    // Find the data for the clicked work
    const workData = currentWorksData.find(w => w.id === workId);

    // Ensure data and modal elements exist
    if (!workData || !modalElement || !modalAuthor || !modalCurrentHabits || !modalReflection || !modalScorecardImage || !modalComicImage) {
        console.error("Cannot open modal: Work data or modal elements missing for ID:", workId);
        alert("無法顯示詳細資訊，請稍後再試。"); // User feedback
        return;
    }

    console.log("Opening modal for work:", workData);

    // Populate modal content safely using escapeHTML (from utils.js)
    modalAuthor.textContent = escapeHTML(workData.author || '匿名');
    modalCurrentHabits.textContent = escapeHTML(workData.currentHabits || '(未提供)');
    modalReflection.textContent = escapeHTML(workData.reflection || '(未提供)');

    // Reset image sources initially to handle loading states or errors
    modalScorecardImage.src = ""; // Clear previous image
    modalComicImage.src = "";   // Clear previous image

    // Assign new sources and error handlers
    // Backend must provide scorecardImageUrl and comicImageUrl
    modalScorecardImage.src = escapeHTML(workData.scorecardImageUrl || '');
    modalScorecardImage.alt = `習慣計分卡 - ${escapeHTML(workData.author || '匿名')}`;
    modalScorecardImage.onerror = function() { handleImageError(this, '計分卡載入失敗'); };

    modalComicImage.src = escapeHTML(workData.comicImageUrl || '');
    modalComicImage.alt = `六格漫畫 - ${escapeHTML(workData.author || '匿名')}`;
    modalComicImage.onerror = function() { handleImageError(this, '漫畫載入失敗'); };

    // Display the modal
    modalElement.style.display = "block";
    // Optional: Trap focus inside the modal for accessibility
    // Optional: Disable scrolling on the body
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the work details modal.
 */
function closeWorkModal() {
    if (modalElement) {
        modalElement.style.display = "none";
        // Optional: Reset content to avoid flash of old content
        modalAuthor.textContent = '';
        modalCurrentHabits.textContent = '';
        modalReflection.textContent = '';
        modalScorecardImage.src = "";
        modalComicImage.src = "";
        // Restore body scrolling
        document.body.style.overflow = '';
    }
}


// --- Gallery Loading ---

/**
 * Fetches works data from the backend API and renders gallery cards.
 */
async function loadAndRenderWorks() {
    if (!workGalleryElement) {
        console.error("loadAndRenderWorks: Gallery element not initialized.");
        return;
    }
    console.log("Fetching works from backend via /works...");
    // Provide immediate feedback
    workGalleryElement.innerHTML = `<p id="gallery-placeholder" class="text-center text-gray-500 col-span-full">正在載入成果...</p>`;

    try {
        const response = await fetch('/works'); // Ensure Flask serves this endpoint
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`, await response.text());
            throw new Error(`伺服器錯誤 (${response.status})`);
        }

        const works = await response.json();
        currentWorksData = works; // Store for modal use
        console.log("Received works data:", currentWorksData);

        workGalleryElement.innerHTML = ''; // Clear loading/placeholder

        if (!Array.isArray(currentWorksData)) {
            console.error("Invalid data format received from /works:", currentWorksData);
            throw new Error("收到的資料格式不正確。");
        }

        if (currentWorksData.length === 0) {
            workGalleryElement.innerHTML = `<p id="gallery-placeholder" class="text-center text-gray-500 col-span-full">還沒有人分享成果喔！快來成為第一位吧！</p>`;
            return;
        }

        // --- Render each work card ---
        currentWorksData.forEach(work => {
            // --- Expected backend data structure ---
            // work = {
            //    id: "unique_id",
            //    author: "作者姓名",
            //    scorecardImageUrl: "/uploads/scorecard_filename.jpg",
            //    comicImageUrl: "/uploads/comic_filename.jpg",
            //    currentHabits: "目前的習慣描述",
            //    reflection: "反思內容"
            // }
            // --- ---
            if (!work || !work.id || !work.scorecardImageUrl || !work.author) {
                console.warn("Skipping card rendering due to missing essential data:", work);
                return; // Skip if essential data is missing
            }

            const card = document.createElement('div');
            card.className = 'work-card fade-in';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0'); // Make focusable
            card.dataset.workId = work.id; // Store ID for modal lookup

            // Safely escape all content
            const escapedAuthor = escapeHTML(work.author || '匿名');
            const escapedPreview = escapeHTML(work.currentHabits || '點此查看詳情');
            // Simple truncation for preview text
            const previewText = escapedPreview.length > 80 ? escapedPreview.substring(0, 80) + '...' : escapedPreview;
            const escapedScorecardUrl = escapeHTML(work.scorecardImageUrl);

            card.innerHTML = `
                <img src="${escapedScorecardUrl}" alt="習慣計分卡預覽 - ${escapedAuthor}" loading="lazy">
                <h5>${escapedAuthor}</h5>
                <p class="description-preview">${previewText}</p>
            `;

            const imgElement = card.querySelector('img');
            if (imgElement) {
                // Ensure utils.js handleImageError is available
                imgElement.onerror = function() { if(typeof handleImageError === 'function') handleImageError(this, `預覽圖載入失敗`); };
            }

            // --- Event Listeners for Card ---
            card.addEventListener('click', () => openWorkModal(work.id));
            card.addEventListener('keydown', (e) => {
                // Trigger modal on Enter or Spacebar for accessibility
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent default spacebar scroll
                    openWorkModal(work.id);
                }
            });

            workGalleryElement.appendChild(card);
        });

    } catch (error) {
        console.error("無法載入或渲染作品:", error);
        // Display error in the gallery area
        if (workGalleryElement) {
             // Ensure utils.js escapeHTML is available
            const displayError = typeof escapeHTML === 'function' ? escapeHTML(error.message) : '載入失敗';
            workGalleryElement.innerHTML = `<p id="gallery-placeholder" class="text-center text-red-600 col-span-full">載入成果時發生錯誤：${displayError}</p>`;
        }
    }
}

// --- Form Handling ---

/**
 * Handles the submission of the MODIFIED work upload form.
 */
async function handleWorkUpload(event) {
    event.preventDefault(); // Stop default form submission

    // Check if all required form elements are correctly assigned from main.js
    if (!authorNameInput || !scorecardImageInput || !comicImageInput || !currentHabitsInput || !reflectionInput || !uploadForm || !uploadStatusElement) {
        console.error("Upload form elements not properly initialized.");
        alert("頁面錯誤，無法提交表單。請重新整理。");
        return;
    }

    const authorName = authorNameInput.value.trim();
    const scorecardFile = scorecardImageInput.files[0];
    const comicFile = comicImageInput.files[0];
    const currentHabits = currentHabitsInput.value.trim();
    const reflection = reflectionInput.value.trim();
    const submitButton = uploadForm.querySelector('button[type="submit"]');

    // Reset status message
    uploadStatusElement.textContent = '';
    uploadStatusElement.className = 'mt-4 text-center text-sm min-h-[1.25em]'; // Use base class

    // --- Frontend Validation ---
    let isValid = true;
    if (!authorName) {
        uploadStatusElement.textContent = '請輸入你的姓名或暱稱！';
        isValid = false;
    } else if(authorName.length > MAX_AUTHOR_LENGTH) {
        uploadStatusElement.textContent = `姓名/暱稱過長 (最多 ${MAX_AUTHOR_LENGTH} 字)。`;
        isValid = false;
    } else if (!scorecardFile) {
        uploadStatusElement.textContent = '請選擇習慣計分卡圖片！';
        isValid = false;
    } else if (!comicFile) {
        uploadStatusElement.textContent = '請選擇六格漫畫圖片！';
        isValid = false;
    } else if (!currentHabits) {
        uploadStatusElement.textContent = '請輸入你目前的習慣描述！';
        isValid = false;
    } else if (currentHabits.length > MAX_DESC_LENGTH_HABITS) {
         uploadStatusElement.textContent = `習慣描述過長 (最多 ${MAX_DESC_LENGTH_HABITS} 字)。`;
         isValid = false;
    } else if (!reflection) {
        uploadStatusElement.textContent = '請輸入反思與展望！';
        isValid = false;
    } else if (reflection.length > MAX_DESC_LENGTH_REFLECTION) {
        uploadStatusElement.textContent = `反思與展望過長 (最多 ${MAX_DESC_LENGTH_REFLECTION} 字)。`;
        isValid = false;
    }

    // Basic file type/size validation (can add more robust checks)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    const maxSize = 16 * 1024 * 1024; // 16MB
     if (scorecardFile && !allowedTypes.includes(scorecardFile.type)) {
          uploadStatusElement.textContent = '計分卡圖片格式不支援 (僅限 PNG, JPG, GIF)。';
          isValid = false;
     } else if (scorecardFile && scorecardFile.size > maxSize) {
          uploadStatusElement.textContent = `計分卡圖片大小超過限制 (${maxSize / 1024 / 1024}MB)。`;
          isValid = false;
     } else if (comicFile && !allowedTypes.includes(comicFile.type)) {
          uploadStatusElement.textContent = '漫畫圖片格式不支援 (僅限 PNG, JPG, GIF)。';
          isValid = false;
     } else if (comicFile && comicFile.size > maxSize) {
         uploadStatusElement.textContent = `漫畫圖片大小超過限制 (${maxSize / 1024 / 1024}MB)。`;
         isValid = false;
     }


    if (!isValid) {
        uploadStatusElement.classList.add('text-red-600');
        return; // Stop submission if validation fails
    }
    // --- End Validation ---

    // Create FormData and append all fields
    const formData = new FormData();
    formData.append('author-name', authorName);
    formData.append('scorecard-image', scorecardFile); // Key must match backend expected key
    formData.append('comic-image', comicFile);         // Key must match backend expected key
    formData.append('current-habits', currentHabits);
    formData.append('reflection', reflection);

    // --- UI Feedback: Submitting ---
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '分享中...';
    }
    uploadStatusElement.textContent = '正在分享你的成果...';
    uploadStatusElement.classList.add('text-blue-600');

    // --- Send Data to Backend ---
    try {
        const response = await fetch('/upload', { // Ensure backend handles POST to /upload
            method: 'POST',
            body: formData
            // No 'Content-Type' header needed for FormData; browser sets it
        });

        const result = await response.json(); // Expect JSON response from backend

        if (response.ok && result.success) {
            uploadStatusElement.textContent = '成果分享成功！';
            uploadStatusElement.classList.remove('text-red-600', 'text-blue-600');
            uploadStatusElement.classList.add('text-green-600');
            if (uploadForm) uploadForm.reset(); // Clear form fields
            await loadAndRenderWorks(); // Refresh the gallery to show the new work
            // Hide success message after a few seconds
            setTimeout(() => {
                 if (uploadStatusElement && uploadStatusElement.classList.contains('text-green-600')) {
                     uploadStatusElement.textContent = '';
                     uploadStatusElement.className = 'mt-4 text-center text-sm min-h-[1.25em]';
                 }
             }, 5000);
        } else {
             // Display error message from backend response
             // Ensure utils.js escapeHTML is available
             const errorMsg = typeof escapeHTML === 'function' ? escapeHTML(result.error || '發生未知錯誤') : (result.error || '發生未知錯誤');
             uploadStatusElement.textContent = `分享失敗: ${errorMsg}`;
             uploadStatusElement.classList.remove('text-blue-600', 'text-green-600');
             uploadStatusElement.classList.add('text-red-600');
             console.error("Upload failed response:", result);
        }
    } catch (error) {
        uploadStatusElement.textContent = '分享過程中發生網路或伺服器連線錯誤。';
        uploadStatusElement.classList.remove('text-blue-600', 'text-green-600');
        uploadStatusElement.classList.add('text-red-600');
        console.error("Error during fetch /upload:", error);
    } finally {
        // Re-enable button regardless of success/failure
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '確認分享';
        }
    }
}