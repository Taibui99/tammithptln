"use strict";
// Content script: mặc định nạp BẢN MỚI NHẤT từ GitHub (CDN), rớt mạng mới dùng bản kèm theo.
// Máy dev (có repo): Console trang Tammi gõ localStorage.tdd_src="bundled" 1 lần
// → từ đó ăn code thẳng từ folder extension (git pull xong F5 là mới tức thì, khỏi chờ CDN).
// Tắt tự chạy: localStorage.tdd_auto="0" → reload.
(function () {
  try {
    if (localStorage.getItem("tdd_auto") === "0" || window.__tdd_booted) return;
    window.__tdd_booted = true;
    var bundled = false;
    try { bundled = localStorage.getItem("tdd_src") === "bundled"; } catch (e) {}
    function useBundled(why) {
      console.log("[tdd] dùng bản kèm theo extension (" + why + ")");
      try {
        var f = document.createElement("script");
        f.src = chrome.runtime.getURL("page.js");
        f.onload = function () { f.remove(); };
        (document.head || document.documentElement).appendChild(f);
      } catch (e) {}
    }
    if (bundled) { useBundled("chế độ bundled"); return; }
    console.log("[tdd] inject, lấy bản mới nhất từ GitHub…");
    var done = false;
    var s = document.createElement("script");
    // ?v= giờ hiện tại: trình duyệt + CDN coi mỗi lần là bản khác nhau → không bao giờ ăn cache cũ
    s.src = "https://cdn.jsdelivr.net/gh/Taibui99/tammithptln@main/extension/page.js?v=" + Date.now();
    s.onload = function () { done = true; s.remove(); };
    s.onerror = function () { s.remove(); useBundled("không tải được CDN"); };
    (document.head || document.documentElement).appendChild(s);
  } catch (e) { /* trang chưa sẵn sàng, bỏ qua */ }
})();
