"use strict";
// Content script (isolated world): bơm page.js vào MAIN world mỗi lần mở tammi.vn.
// Tắt tự chạy: mở Console trang Tammi, gõ localStorage.tdd_auto="0" rồi reload.
try {
  if (localStorage.getItem("tdd_auto") !== "0") {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("page.js");
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  }
} catch (e) { /* trang chưa sẵn sàng, bỏ qua */ }
