/* BOOKMARKLET DÒ — chỉ ĐỌC, không sửa/không gửi gì ra ngoài.
 * Cách chạy test: mở tammi.vn (đã login acc đủ nhóm) → F12 → Console →
 * paste toàn bộ file này → Enter. Chụp output gửi lại (NHỚ che giá trị token).
 */
(function () {
  const out = { url: location.href, ua: navigator.userAgent.slice(0, 80), t: new Date().toISOString() };
  try {
    // 1. SDK ZIM có nằm sẵn trong trang?
    out.hasWindowZIM = typeof window.ZIM;
    try { out.zimVersion = window.ZIM && window.ZIM.getVersion ? window.ZIM.getVersion() : "(có ZIM, không đọc được version)"; } catch (e) { out.zimVersion = "lỗi: " + e.message; }
    out.zimInstance = !!(window.ZIM && window.ZIM.getInstance && window.ZIM.getInstance());
    // 2. Globals liên quan chat (chỉ lấy TÊN, không lấy giá trị)
    out.suspectGlobals = Object.keys(window).filter((k) => /zim|tammi|chat|conv|zego|message/i.test(k)).slice(0, 40);
    // 3. localStorage: chỉ lấy TÊN key + độ dài (KHÔNG lấy giá trị token)
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      keys.push(k + " (len=" + (localStorage.getItem(k) || "").length + ")");
    }
    out.localStorageKeys = keys;
    // 4. Style của Tammi để clone UI cho đồng bộ
    const cs = getComputedStyle(document.body);
    out.ui = { bg: cs.backgroundColor, color: cs.color, font: cs.fontFamily.slice(0, 120) };
    const btn = document.querySelector("button");
    if (btn) { const b = getComputedStyle(btn); out.ui.btnBg = b.backgroundColor; out.ui.btnRadius = b.borderRadius; }
    const vars = {};
    for (const sh of document.styleSheets) {
      try {
        for (const r of sh.cssRules) {
          if (r.selectorText === ":root" && r.style) {
            for (let i = 0; i < r.style.length && Object.keys(vars).length < 20; i++) {
              const p = r.style[i];
              if (/color|primary|brand|red|bg/i.test(p)) vars[p] = r.style.getPropertyValue(p).trim();
            }
          }
        }
      } catch (e) { /* cross-origin css, bỏ qua */ }
    }
    out.ui.cssVars = vars;
    // 5. Đếm sơ nhóm chat thấy được trong DOM (không đọc nội dung)
    out.domHints = {
      asideCount: document.querySelectorAll("aside,[class*=conv],[class*=chat-list],[class*=sidebar]").length,
      reactHints: document.querySelectorAll("[class*=react],[class*=emotion],[class*=emoji]").length,
    };
  } catch (e) { out.error = e.message; }
  // Vẽ panel + nút copy
  const old = document.getElementById("tammi-probe");
  if (old) old.remove();
  const d = document.createElement("div");
  d.id = "tammi-probe";
  d.style.cssText = "position:fixed;z-index:999999;top:12px;right:12px;width:420px;max-height:80vh;overflow:auto;background:#fff;color:#111;border:2px solid #e60012;border-radius:12px;padding:12px;font:13px/1.5 system-ui;box-shadow:0 8px 30px rgba(0,0,0,.3)";
  d.innerHTML = "<b>◈ TAMMI PROBE (chỉ đọc)</b><br><span style='color:#666'>Copy JSON dưới gửi lại (đã ẩn giá trị token, chỉ còn tên key).</span><pre id='tammi-probe-json' style='white-space:pre-wrap;background:#f5f5f5;padding:8px;border-radius:8px'></pre><button id='tammi-probe-copy' style='padding:6px 12px;border-radius:8px;border:0;background:#e60012;color:#fff;font-weight:700'>Copy JSON</button> <button id='tammi-probe-x' style='padding:6px 12px;border-radius:8px'>Đóng</button>";
  document.body.appendChild(d);
  document.getElementById("tammi-probe-json").textContent = JSON.stringify(out, null, 1);
  document.getElementById("tammi-probe-copy").onclick = () => navigator.clipboard.writeText(JSON.stringify(out, null, 1)).then(() => alert("Đã copy! Dán gửi lại nhé."));
  document.getElementById("tammi-probe-x").onclick = () => d.remove();
  console.log("[tammi-probe]", out);
})();
