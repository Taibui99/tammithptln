"use strict";
// Content script: mỗi lần mở tammi.vn thì nạp BẢN MỚI NHẤT từ GitHub (CDN),
// tải lỗi mới dùng bản kèm theo extension. Nhờ vậy update = git push,
// máy thầy không cài lại, không bấm reload extension.
// Tắt tự chạy: Console trang Tammi → localStorage.tdd_auto="0" → reload.
(function () {
  try {
    if (localStorage.getItem("tdd_auto") === "0" || window.__tdd_booted) return;
    window.__tdd_booted = true;
    console.log("[tdd] inject, lấy bản mới nhất từ GitHub…");
    var done = false;
    function useBundled(why) {
      if (done) return;
      done = true;
      console.log("[tdd] dùng bản kèm theo extension (" + why + ")");
      try {
        var f = document.createElement("script");
        f.src = chrome.runtime.getURL("page.js");
        f.onload = function () { f.remove(); };
        (document.head || document.documentElement).appendChild(f);
      } catch (e) {}
    }
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/gh/Taibui99/tammithptln@main/extension/page.js";
    s.onload = function () { done = true; s.remove(); };
    s.onerror = function () { s.remove(); useBundled("không tải được CDN"); };
    (document.head || document.documentElement).appendChild(s);
  } catch (e) { /* trang chưa sẵn sàng, bỏ qua */ }
})();
