// js/keep-alive.js

/**
 * Sends a background request to the server to prevent Render free tier inactivity timeout.
 */
function keepAwake() {
    console.log("正在發送 keep-alive 請求...");
    // Fetch the root or any valid endpoint. We discard the response.
    fetch('/') // Or use '/works' if you prefer
        .then(response => {
            if (response.ok) {
                console.log("Keep-alive 請求成功。");
            } else {
                 console.warn(`Keep-alive 請求收到非 2xx 回應: ${response.status}`);
            }
        })
        .catch(error => {
             // Don't alert the user, just log errors
             console.error("Keep-alive 請求失敗:", error);
        });
}

/**
 * Starts the keep-alive timer.
 * @param {number} intervalMs - The interval in milliseconds (e.g., 10 minutes).
 */
function startKeepAliveTimer(intervalMs = 10 * 60 * 1000) {
    if (intervalMs < 60000) { // Prevent excessively frequent pings
        console.warn("Keep-alive interval is very short (< 1 min).");
        intervalMs = 60000;
    }
    // Run once immediately on load
    keepAwake();
    // Then set the interval
    setInterval(keepAwake, intervalMs);
    console.log(`已設定每 ${intervalMs / 60000} 分鐘自動發送 keep-alive 請求。`);
}

// Export function if using modules
// export { startKeepAliveTimer };