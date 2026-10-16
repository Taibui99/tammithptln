/* ĐẦU DÒ HỌP TAMMI — chỉ ĐỌC, chạy ĐÚNG LÚC đang có cuộc họp diễn ra.
 * Cách chạy: mở tammi.vn (acc trong nhóm họp) → F12 Console → paste → Enter.
 * Nó liệt kê lời mời/cuộc gọi mà SDK thấy + số người trong từng cuộc.
 * Copy JSON gửi lại (không chứa token).
 */
(function () {
  const out = { t: new Date().toISOString(), calls: null, err: null };
  function done() {
    const old = document.getElementById("tammi-mprobe");
    if (old) old.remove();
    const d = document.createElement("div");
    d.id = "tammi-mprobe";
    d.style.cssText = "position:fixed;z-index:999999;top:12px;right:12px;width:460px;max-height:80vh;overflow:auto;background:#fff;color:#111;border:2px solid #e60012;border-radius:12px;padding:12px;font:13px/1.5 system-ui";
    d.innerHTML = "<b>◈ MEETING PROBE</b> <button id='mpx' style='float:right'>Đóng</button><pre id='mpxj' style='white-space:pre-wrap;background:#f5f5f5;padding:8px;border-radius:8px'></pre><button id='mpc'>Copy JSON</button>";
    document.body.appendChild(d);
    document.getElementById("mpxj").textContent = JSON.stringify(out, null, 1).slice(0, 6000);
    document.getElementById("mpx").onclick = () => d.remove();
    document.getElementById("mpc").onclick = () => navigator.clipboard.writeText(JSON.stringify(out)).then(() => alert("Đã copy!"));
    console.log("[mprobe]", out);
  }
  (async () => {
    try {
      const z = window.__zimInstance || (window.ZIM && window.ZIM.getInstance && window.ZIM.getInstance());
      if (!z) { out.err = "không thấy __zimInstance"; done(); return; }
      out.hasQueryCalls = typeof z.queryCallInvitationList;
      // thử nhiều kiểu tham số vì chưa rõ SDK Tammi
      const tries = [{}, { count: 100 }, { nextFlag: 0, count: 100 }];
      for (const p of tries) {
        try {
          const r = await z.queryCallInvitationList(p);
          out.calls = { params: p, keys: r && Object.keys(r), sample: JSON.stringify(r).slice(0, 3000) };
          break;
        } catch (e) { out["try_" + JSON.stringify(p)] = e.message || String(e).slice(0, 200); }
      }
    } catch (e) { out.err = e.message; }
    done();
  })();
})();
