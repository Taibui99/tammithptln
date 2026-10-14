"use strict";
// Popup extension: bơm page.js vào tab tammi.vn ở MAIN world (thấy window.__zimInstance).
document.getElementById("go").addEventListener("click", async () => {
  const st = document.getElementById("st");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith("https://tammi.vn")) {
      st.textContent = "Hãy mở tab tammi.vn đang login trước đã.";
      return;
    }
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: "MAIN", files: ["page.js"] });
    st.textContent = "Đã chạy — xem panel trên trang Tammi nhé.";
    setTimeout(() => window.close(), 900);
  } catch (e) {
    st.textContent = "Lỗi: " + (e.message || e);
  }
});
