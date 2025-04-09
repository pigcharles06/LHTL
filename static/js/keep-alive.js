// static/js/keep-alive.js

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
 * @param {number} [intervalMs=600000] - The interval in milliseconds (default 10 minutes).
 */
function startKeepAliveTimer(intervalMs = 10 * 60 * 1000) {
    const minInterval = 5 * 60 * 1000; // Minimum 5 minutes to be safe
    if (intervalMs < minInterval) {
        console.warn(`Keep-alive interval too short, setting to ${minInterval / 60000} minutes.`);
        intervalMs = minInterval;
    }
    // Run once immediately on load
    keepAwake();
    // Then set the interval
    setInterval(keepAwake, intervalMs);
    console.log(`已設定每 ${intervalMs / 60000} 分鐘自動發送 keep-alive 請求。`);
}