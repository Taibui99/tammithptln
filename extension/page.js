/* NUT DIEM DANH TAMMI - ban extension (chay o page world). File nay do popup/inject goi. Dung sua tay: sua web/bookmarklet-check.js roi chay node sync-page.js. */
(function () {
  var l = document.getElementById("tdd-load");
  if (l) l.remove();
  var manual = !!window.__tdd_manual;
  window.__tdd_manual = false;
  var p = document.getElementById("tdiemdanh");
  if (p) { p.remove(); if (!manual) return; }
  const BRAND = "#EE0033", INK = "#1d1d1d";
  const TDD_VER = "1.9";
  window.__tdd_kind = "ext";
  const css = `font-family:"Sans Flex",system-ui,sans-serif`;
  const root = document.createElement("div");
  root.id = "tdiemdanh";
  root.style.cssText = `position:fixed;z-index:999999;top:16px;right:16px;width:560px;max-width:92vw;max-height:86vh;display:flex;flex-direction:column;background:#fff;color:${INK};border-radius:20px;box-shadow:0 16px 50px rgba(0,0,0,.35);overflow:hidden;${css}`;
  root.innerHTML = `
    <div style="background:${BRAND};color:#fff;padding:12px 16px;font-weight:800;font-size:15px;display:flex;justify-content:space-between;align-items:center">
      <span>◈ ĐIỂM DANH TAMMI · THPT LỘC NINH <span style="background:rgba(255,255,255,.25);border-radius:1000px;padding:1px 8px;font-size:11px">v${TDD_VER}</span></span>
      <span style="display:flex;gap:6px">
        <button id="tdd-upd" title="Kiểm tra cập nhật" style="border:0;background:rgba(255,255,255,.25);color:#fff;border-radius:1000px;width:28px;height:28px;cursor:pointer;font-weight:800">⟳</button>
        <button id="tdd-big" title="Phóng to" style="border:0;background:rgba(255,255,255,.25);color:#fff;border-radius:1000px;width:28px;height:28px;cursor:pointer;font-weight:800">⛶</button>
        <button id="tdd-set" title="Cài đặt" style="border:0;background:rgba(255,255,255,.25);color:#fff;border-radius:1000px;width:28px;height:28px;cursor:pointer;font-weight:800">⚙</button>
        <button id="tdd-x" style="border:0;background:rgba(255,255,255,.25);color:#fff;border-radius:1000px;width:28px;height:28px;cursor:pointer;font-weight:800">✕</button>
      </span>
    </div>
    <div style="padding:12px 16px;border-bottom:1px solid #f0dfe3;font-size:13px">
      <div id="tdd-status" style="margin-bottom:8px">Bấm <b>Quét ngay</b> để điểm danh 39 nhóm chi đoàn.</div>
      <div style="height:10px;background:#f3e2e6;border-radius:1000px;overflow:hidden"><div id="tdd-bar" style="height:100%;width:0%;background:${BRAND};border-radius:1000px;transition:width .2s"></div></div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button id="tdd-go" style="border:0;background:${BRAND};color:#fff;border-radius:1000px;padding:8px 18px;font-weight:800;cursor:pointer">Quét ngay</button>
        <button id="tdd-copy" style="border:1px solid ${BRAND};background:#fff;color:${BRAND};border-radius:1000px;padding:8px 14px;font-weight:700;cursor:pointer">Copy kết quả</button>
      </div>
      <details style="margin-top:8px"><summary style="cursor:pointer;color:#666">Lưu lên Supabase (tùy chọn)</summary>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
          <input id="tdd-url" placeholder="https://xxx.supabase.co" style="flex:2;border:1px solid #ddd;border-radius:1000px;padding:6px 12px">
          <input id="tdd-key" placeholder="anon key" style="flex:2;border:1px solid #ddd;border-radius:1000px;padding:6px 12px">
          <button id="tdd-push" style="border:0;background:#111;color:#fff;border-radius:1000px;padding:6px 14px;cursor:pointer">Lưu + Đẩy</button>
        </div>
      </details>
      <div id="tdd-settings" style="display:none;background:#faf7f8;border:1px solid #f0dfe3;border-radius:14px;padding:10px 12px;margin-top:8px;font-size:12px">
        <b>⚙ CÀI ĐẶT</b>
        <div style="margin:8px 0">Chế độ chấm:<br>
          <label><input type="radio" name="tdd-mode" value="react"> Tim tin NAM (nhanh)</label><br>
          <label><input type="radio" name="tdd-mode" value="range" checked> Tương tác cả đợt — từ tin NAM tới <input id="tdd-after" type="number" min="1" max="29" value="10" style="width:48px;border:1px solid #ddd;border-radius:8px;padding:2px 6px"> tin sau</label>
          <div style="color:#888">Cả đợt: ai gửi tin/nhả tim trong đoạn đó đều tính đã tương tác.</div></div>
        <div style="margin:8px 0"><label><input type="checkbox" id="tdd-auto-cb"> Tự bung panel mỗi lần mở Tammi.vn (extension)</label></div>
        <div style="margin:8px 0"><b>Loại trừ (<span id="tdd-exn">0</span>)</b> — bấm × ở tên trong chi tiết lớp cũng được
          <div style="display:flex;gap:6px;margin:6px 0"><input id="tdd-exname" placeholder="Tên hoặc user_id cần loại…" style="flex:1;border:1px solid #ddd;border-radius:1000px;padding:6px 12px">
          <button id="tdd-exadd" style="border:0;background:#111;color:#fff;border-radius:1000px;padding:6px 14px;cursor:pointer">+ Thêm</button></div>
          <div id="tdd-exlist"></div></div>
      </div>
    </div>
    <div id="tdd-body" style="padding:8px 16px;overflow:auto;font-size:13px"></div>`;
  document.body.appendChild(root);
  document.getElementById("tdd-x").onclick = () => root.remove();
  document.getElementById("tdd-upd").onclick = () => window.tddCheckUpdate();
  // Nút cập nhật: so version.txt trên GitHub với bản đang chạy; có mới thì tự tải lại
  window.tddCheckUpdate = async () => {
    say("Đang kiểm tra cập nhật…");
    const base = "https://cdn.jsdelivr.net/gh/Taibui99/tammithptln@main/";
    const file = (window.__tdd_kind === "ext" ? "extension/page.js" : "web/bookmarklet-check.js");
    try {
      const v = (await (await fetch(base + "version.txt?v=" + Date.now())).text()).trim();
      if (!v) throw new Error("rỗng");
      if (v === TDD_VER) { say(`Đã ở bản mới nhất (v${TDD_VER}) ✓`); return; }
      say(`Có bản mới v${v} (đang v${TDD_VER}) — đang cập nhật, đợi chút…`);
      try { sessionStorage.tdd_updated_from = TDD_VER; } catch (e) {}
      try { document.getElementById("tdiemdanh").remove(); } catch (e) {}
      window.__tdd_booted = false;
      const s = document.createElement("script");
      s.src = base + file + "?v=" + Date.now();
      s.onerror = () => say("Tải bản mới lỗi — F5 trang rồi thử lại.");
      document.body.appendChild(s);
    } catch (e) { say("Không kiểm tra được (mạng/CSP) — thử F5 trang."); }
  };
  let BIG = false;
  document.getElementById("tdd-big").onclick = () => {
    BIG = !BIG;
    root.style.width = BIG ? "920px" : "560px";
    root.style.top = BIG ? "5vh" : "16px";
    root.style.maxHeight = BIG ? "90vh" : "86vh";
    if (BIG) { root.style.left = "50%"; root.style.right = "auto"; root.style.transform = "translateX(-50%)"; }
    else { root.style.left = ""; root.style.right = "16px"; root.style.transform = ""; }
  };
  document.getElementById("tdd-set").onclick = () => {
    const s = document.getElementById("tdd-settings");
    s.style.display = s.style.display === "none" ? "" : "none";
  };
  // mục đang mở (giữ nguyên sau mỗi lần vẽ lại — sửa lỗi bấm × là xẹp)
  const OPEN = new Set();
  function paintEx() {
    try {
      const a = getEx();
      const n = document.getElementById("tdd-exn"); if (n) n.textContent = a.length;
      const box = document.getElementById("tdd-exlist"); if (!box) return;
      box.innerHTML = a.map((e, i) => `<span style="display:inline-block;background:#eee;border-radius:1000px;padding:3px 6px 3px 10px;margin:2px;font-size:12px">${e.name || e.id} <button onclick="window.tddExDel(${i})" style="border:0;background:#999;color:#fff;border-radius:1000px;width:18px;height:18px;cursor:pointer">×</button></span>`).join("") || "<span style='color:#999'>Chưa loại ai</span>";
    } catch (e) {}
  }
  function liOf(m) {
    const safe = String(m.name || "").replace(/'/g, "");
    return `<span style="display:inline-block;background:#f6f0f1;border-radius:1000px;padding:3px 6px 3px 10px;margin:2px;font-size:12px">${m.name} <button onclick="event.stopPropagation();window.tddExAdd('${m.id}','${safe}')" title="Loại người này" style="border:0;background:${BRAND};color:#fff;border-radius:1000px;width:18px;height:18px;cursor:pointer;font-size:11px">×</button></span>`;
  }

  // chế độ chấm đang dùng (đọc lúc quét) — mặc định: có tương tác là tính
  var MODE_USED = "range";
  function readMode() {
    try {
      const c = document.querySelector('input[name="tdd-mode"]:checked');
      const md = (c && c.value) || localStorage.tdd_mode || "range";
      localStorage.tdd_mode = md;
      const an = Math.max(1, Math.min(29, Number(($("tdd-after") || {}).value || localStorage.tdd_after || 10)));
      localStorage.tdd_after = an;
      return { mode: md, after: an };
    } catch (e) { return { mode: "range", after: 10 }; }
  }
  function dispOf(r) {
    const v = netOf(r);
    if (MODE_USED === "range" && r.rangeIds) {
      const ids = r.rangeIds.filter((id) => !isEx(id, r.names[id]));
      return { n: ids.length, t: v.mem.length, mode: "range" };
    }
    return { n: v.n, t: v.t, mode: "react" };
  }
  try {
    document.getElementById("tdd-url").value = localStorage.tdd_supa_url || "";
    document.getElementById("tdd-key").value = localStorage.tdd_supa_key || "";
  } catch (e) {}

  const $ = (id) => document.getElementById(id);
  const setBar = (p) => ($("tdd-bar").style.width = Math.round(p * 100) + "%");
  const say = (h) => ($("tdd-status").innerHTML = h);
  let LAST = [];

  // ---- Loại trừ (lưu ở trình duyệt, không cần server) ----
  function getEx() { try { return JSON.parse(localStorage.tdd_exclude || "[]"); } catch (e) { return []; } }
  function setEx(a) { try { localStorage.tdd_exclude = JSON.stringify(a); } catch (e) {} }
  // Tên "X (bạn)" là cách Tammi ghi tên của chính acc đang login — chuẩn hoá để đếm cho đúng
  function normName(s) { return String(s || "").replace(/\s*\(b[aạ]n\)\s*$/i, "").trim(); }
  function normBasic(s) { return normName(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"); }
  function isEx(id, nm) {
    const U = normBasic(nm).toUpperCase();
    return getEx().some((e) => (e.id && e.id === id) || (e.name && U.includes(normBasic(e.name).toUpperCase())));
  }
  window.tddExAdd = (id, nm) => {
    try {
      const a = getEx();
      if (!a.some((e) => e.id === id)) a.push({ id: id || null, name: nm || null });
      setEx(a); paintEx(); if (LAST.length) render(LAST);
    } catch (e) { console.log("[tdd] exadd lỗi:", e.message); }
  };
  window.tddExDel = (i) => { try { const a = getEx(); a.splice(i, 1); setEx(a); paintEx(); if (LAST.length) render(LAST); } catch (e) {} };
  window.tddExAddByName = () => {
    const v = ($("tdd-exname") || {}).value;
    if (v && v.trim()) { const a = getEx(); a.push({ id: null, name: v.trim() }); setEx(a); paintEx(); render(LAST); }
  };
  function netOf(r) {
    const mem = (r.members || []).filter((m) => !isEx(m.id, m.name));
    const rea = (r.reactors || []).filter((id) => !isEx(id, (r.names || {})[id]));
    return { n: rea.length, t: mem.length, reaIds: rea, mem };
  }

  try {
    const md = localStorage.tdd_mode || "range";
    const rr = document.querySelector('input[name="tdd-mode"][value="' + md + '"]');
    if (rr) rr.checked = true;
    if ($("tdd-after")) $("tdd-after").value = localStorage.tdd_after || 10;
    if ($("tdd-auto-cb")) {
      $("tdd-auto-cb").checked = localStorage.tdd_auto !== "0";
      $("tdd-auto-cb").onchange = (e) => { try { localStorage.tdd_auto = e.target.checked ? "1" : "0"; } catch (x) {} };
    }
    const eb = $("tdd-exadd"); if (eb) eb.onclick = () => window.tddExAddByName();
    paintEx();
  } catch (e) {}

  function zim() {
    const z = window.__zimInstance || (window.ZIM && window.ZIM.getInstance && window.ZIM.getInstance());
    if (!z) throw new Error("Không thấy phiên ZIM trong trang. Hãy tải lại tammi.vn rồi thử lại.");
    return z;
  }
  function senderOf(m) {
    try { const e = m.extendedData ? JSON.parse(m.extendedData) : {}; if (e.senderName) return normName(e.senderName); } catch (x) {}
    return m.senderUserID || "?";
  }
  async function reactors(z, target, rt) {
    // Không bao giờ throw: tin chưa có reaction thì trả rỗng (SDK hay quăng TypeError kiểu reading '71')
    let ids = [];
    try {
      ids = (((target.reactions || []).find((r) => r.reactionType === rt) || {}).userList || []).map((u) => u && u.userID).filter(Boolean);
      if (!target || !target.messageSeq) return [...new Set(ids)];
      let nf = 0;
      for (let i = 0; i < 12; i++) {
        const r = await z.queryMessageReactionUserList(target, { reactionType: rt, count: 50, nextFlag: nf });
        for (const u of r.userList || []) { const id = u && (u.userID || u.userId); if (id && !ids.includes(id)) ids.push(id); }
        if (!r.nextFlag) break;
        nf = r.nextFlag;
      }
    } catch (e) { console.log("[tdd] bỏ qua query tim:", rt, "-", e && e.message); }
    return [...new Set(ids)];
  }

  async function scan() {
    const z = zim();
    // Nhận diện chính acc đang quét bằng ID (chắc ăn hơn đoán qua đuôi "(bạn)") rồi tự loại
    try {
      const si = await z.querySelfUserInfo().catch(() => null);
      const u = si && (si.userID || si.userId || (si.selfUserInfo && (si.selfUserInfo.userID || si.selfUserInfo.userId)) || (si.userInfo && (si.userInfo.userID || si.userInfo.userId)));
      const nm = si && (si.userName || si.nickname || (si.selfUserInfo && (si.selfUserInfo.userName || si.selfUserInfo.nickname)));
      if (u) { const a = getEx(); if (!a.some((e) => e.id === u)) { a.push({ id: u, name: normName(nm) || null }); setEx(a); paintEx(); } }
    } catch (e) {}
    say("Đang lấy danh sách nhóm (phân trang)…"); setBar(0.02);
    const groups = [];
    let nextConv = null;
    for (let pg = 0; pg < 5; pg++) {
      const conv = await z.queryConversationList({ count: 100, nextConversation: nextConv });
      const list = conv.conversationList || [];
      if (!list.length) break;
      for (const c of list) {
        if ((c.type === 2 || c.type === 3) && (c.conversationName || "").toLowerCase().includes("chi đoàn")) groups.push(c);
      }
      if (list.length < 100) break;
      nextConv = list[list.length - 1];
    }
    if (!groups.length) { say("Không thấy nhóm chi đoàn nào trong tài khoản này."); return; }
    const start = Date.now();
    const day = new Date(); day.setHours(0, 0, 0, 0);
    const out = [];
    LAST = out; // render dần từng nhóm cho đỡ sốt ruột
    OPEN.clear();
    var mm = readMode(); MODE_USED = mm.mode;
    say(`Chế độ: <b>${MODE_USED === "range" ? "tương tác cả đợt (" + mm.after + " tin sau tin NAM)" : "tim tin NAM"}</b> — đang lấy danh sách nhóm…`);
    let i = 0;
    for (const g of groups) {
      i++;
      say(`Đang quét ${i}/${groups.length}: <b>${g.conversationName}</b>… (đã xong ${out.filter((r) => r.ok).length})`); setBar(i / groups.length * 0.9);
      let phase = "history";
      try {
        const h = await z.queryHistoryMessage(g.conversationID, 2, { count: 100, reverse: true });
        const list = h.messageList || [];
        const t = list.find((m) => { const s = senderOf(m).toUpperCase(); return (s.includes("TRƯƠNG KHẮC NAM") || s.includes("TRUONG KHAC NAM")) && m.timestamp >= day.getTime(); })
          || list.find((m) => { const s = senderOf(m).toUpperCase(); return s.includes("TRƯƠNG KHẮC NAM") || s.includes("TRUONG KHAC NAM"); });
        if (!t) { out.push({ name: g.conversationName, ok: false, note: "chưa có tin hôm nay" }); render(out); continue; }
        phase = "reactors";
        const rts = [...new Set((t.reactions || []).map((r) => r.reactionType))];
        let all = [];
        for (const rt of rts) all.push(...await reactors(z, t, rt));
        all = [...new Set(all)];
        phase = "members";
        const members = [], names = {};
        var selfId = null; // acc đang quét (tên có đuôi " (bạn)") — tự loại, không phải học sinh
        try {
          let n = 0;
          for (let p = 0; p < 5; p++) {
            const m = await z.queryGroupMemberList(g.conversationID, { count: 100, nextFlag: n });
            for (const u of (m.groupMemberList || m.memberList || m.userList || [])) {
              const id = u.userID || u.userId || u.id;
              const raw = u.userName || u.nickname || id;
              const nm = normName(raw) || id;
              if (id) {
                members.push({ id, name: nm }); names[id] = nm;
                if (selfId === null && /\(b[aạ]n\)\s*$/i.test(String(raw))) selfId = id;
              }
            }
            if (!m.nextFlag) break; n = m.nextFlag;
          }
        } catch (e) {}
        if (selfId) {
          const a = getEx();
          if (!a.some((e) => e.id === selfId)) { a.push({ id: selfId, name: names[selfId] }); setEx(a); }
        }
        const rc = (t.reactions || []).reduce((s, r) => s + (r.totalCount || 0), 0);
        // Cộng dồn: ai từng tim BẤT KỲ tin NAM nào trong lịch sử gần đây (tối đa 10 tin)
        var namIds = null, namN = 0;
        try {
          const isNAMm = (m) => { const s = senderOf(m).toUpperCase(); return s.includes("TRƯƠNG KHẮC NAM") || s.includes("TRUONG KHAC NAM"); };
          const namAll = list.filter(isNAMm).slice(-10);
          namN = list.filter(isNAMm).length;
          const nset = new Set();
          for (const nm of namAll) {
            const nrts = [...new Set((nm.reactions || []).map((r) => r.reactionType))];
            for (const rt of (nrts.length ? nrts : [])) {
              try { (await reactors(z, nm, rt)).forEach((id) => nset.add(id)); } catch (e) {}
            }
          }
          namIds = [...nset].filter(Boolean);
        } catch (e) {}
        phase = "nam";
        var rangeIds = null, rangeN = 0;
        if (MODE_USED === "range") {
          var cands = list.filter((m) => m.timestamp > t.timestamp).sort((a, b) => b.timestamp - a.timestamp).slice(0, mm.after);
          rangeN = cands.length;
          var set = new Set(all);
          if (t.senderUserID) set.add(t.senderUserID);
          // Tim 1 tin bất kỳ trong đợt là tính — query full từng tin sau (không đọc mẫu cache)
          for (const cm of cands) {
            if (cm.senderUserID) set.add(cm.senderUserID);
            const crts = [...new Set((cm.reactions || []).map((r) => r.reactionType))];
            for (const rt of crts) {
              try { (await reactors(z, cm, rt)).forEach((id) => set.add(id)); } catch (e) {}
            }
            for (const r2 of (cm.reactions || [])) for (const u of (r2.userList || [])) { const id = u.userID || u.userId; if (id) set.add(id); }
          }
          rangeIds = [...set].filter(Boolean);
        }
        out.push({ name: g.conversationName, gid: g.conversationID, ok: true, reactors: all, members, names, rc, msgId: t.messageID, msgTime: t.timestamp, rangeIds, rangeN, namIds, namN });
      } catch (e) { out.push({ name: g.conversationName, ok: false, note: phase + ": " + (e.message || "lỗi") }); }
      render(out);
      await new Promise((r) => setTimeout(r, 350)); // nghỉ giữa các nhóm cho đỡ lag Chrome
    }
    LAST = out;
    const secs = ((Date.now() - start) / 1000).toFixed(0);
    setBar(1);
    say(`Xong ${out.length} nhóm trong ${secs}s · ${new Date().toLocaleString("vi-VN")}`);
    render(out);
  }

  let FILTER = "all";
  window.tddFilter = (f) => { FILTER = f; if (LAST.length) render(LAST); };

  window.tddOpen = (idx) => {
    const box = $("tdd-d" + idx);
    if (!box) return;
    if (OPEN.has(idx)) { OPEN.delete(idx); box.innerHTML = ""; return; }
    const r = LAST[idx];
    if (!r || !r.ok) return;
    OPEN.add(idx);
    box.innerHTML = detailHTML(r);
  };

  function detailHTML(r) {
    const v = netOf(r);
    let yes, no, yesT, noT;
    if (r.rangeIds && MODE_USED === "range") {
      const rset = new Set(r.rangeIds.filter((id) => !isEx(id, r.names[id])));
      yes = v.mem.filter((m) => rset.has(m.id));
      no = v.mem.filter((m) => !rset.has(m.id));
      yesT = `✓ ĐÃ TƯƠNG TÁC (${yes.length}) — tim/gửi bất kỳ tin nào trong đợt`;
      noT = `✗ IM LẶNG CẢ ĐỢT (${no.length})`;
    } else {
      const inSet = new Set(v.reaIds);
      yes = []; no = [];
      v.mem.forEach((m) => ((inSet.has(m.id) ? yes : no).push(m)));
      yesT = `✓ TIM TIN NAM (${yes.length})`;
      noT = `✗ CHƯA TIM TIN NAM (${no.length})`;
    }
    let neverH = "";
    if (r.namIds) {
      const nset = new Set(r.namIds.filter((id) => !isEx(id, r.names[id])));
      const never = v.mem.filter((m) => !nset.has(m.id));
      neverH = `<div style="font-weight:800;color:#7c2d12;margin:8px 0 4px">◈ CHƯA TỪNG TIM TIN NAM (${never.length}) — trong ${r.namN || "?"} tin NAM gần nhất</div>
      <div>${never.length ? never.map(liOf).join("") : "<span style='color:#999'>—</span>"}</div>`;
    }
    return `<div style="background:#faf7f8;border-radius:12px;padding:8px 10px;margin:2px 0 8px">
      <div style="font-weight:800;color:#1a7f37;margin:4px 0">${yesT}</div>
      <div>${yes.length ? yes.map(liOf).join("") : "<span style='color:#999'>—</span>"}</div>
      <div style="font-weight:800;color:${BRAND};margin:8px 0 4px">${noT}</div>
      <div>${no.length ? no.map(liOf).join("") : "<span style='color:#999'>—</span>"}</div>
      ${neverH}
      <div style="color:#999;font-size:11px;margin-top:6px">Bấm × ở tên để loại người đó khỏi thống kê.</div></div>`;
  }

  function render(out) {
    const body = $("tdd-body");
    const good = out.filter((r) => r.ok);
    let sumN = 0, sumT = 0;
    good.forEach((r) => { const d = dispOf(r); sumN += d.n; sumT += d.t; });
    const exN = getEx().length;
    const pct = sumT ? Math.round(sumN / sumT * 1000) / 10 : 0;
    const passN = good.filter((r) => { const d = dispOf(r); return d.t && d.n / d.t >= 0.7; }).length;
    const col = pct >= 70 ? "#1a7f37" : pct >= 50 ? "#9a6700" : BRAND;
    const card = (label, val, sub) => `<div style="flex:1;background:#faf7f8;border:1px solid #f0dfe3;border-radius:14px;padding:8px 10px;min-width:0">
      <div style="font-size:11px;color:#888">${label}</div>
      <div style="font-size:20px;font-weight:800">${val}</div>
      <div style="font-size:11px;color:#888">${sub}</div></div>`;
    let h = `<div style="display:flex;gap:8px;margin:4px 0 10px">
      ${card("Đã tương tác", sumN + "<span style='color:#999;font-size:13px'>/" + sumT + "</span>", exN ? "đã trừ " + exN + " người" : "tổng 39 nhóm")}
      ${card("Tỉ lệ chung", `<span style="color:${col}">${pct}%</span>`, "chuẩn đạt ≥ 70%")}
      ${card("Lớp đạt", passN + "<span style='color:#999;font-size:13px'>/" + good.length + "</span>", (out.length - good.length) ? (out.length - good.length) + " nhóm lỗi" : "quét sạch")}</div>`;

    h += `<div style="display:flex;gap:6px;margin-bottom:8px">
      ${["all", "fail", "pass"].map((f) => `<button onclick="window.tddFilter('${f}')" style="border:0;border-radius:1000px;padding:6px 14px;cursor:pointer;font-weight:700;font-size:12px;${FILTER === f ? `background:${BRAND};color:#fff` : "background:#f3e2e6;color:#7a4a52"}">${f === "all" ? "Tất cả" : f === "fail" ? "Chưa đạt" : "Đã đạt"}</button>`).join("")}
      <span style="font-size:11px;color:#999;align-self:center">Bấm vào lớp để xem từng người${MODE_USED === "range" ? " · <b>chế độ cả đợt</b>" : ""}</span></div>`;
    h += `<div>`;
    out.forEach((r, idx) => {
      if (!r.ok) {
        if (FILTER === "pass") return;
        h += `<div style="padding:8px 4px;border-top:1px solid #f2f2f2;color:#999">${r.name} — ${r.note}</div>`; return;
      }
      const d = dispOf(r);
      const p = d.t ? Math.round(d.n / d.t * 1000) / 10 : 0;
      if (FILTER === "fail" && p >= 70) return;
      if (FILTER === "pass" && p < 70) return;
      const c = p >= 70 ? "#1a7f37" : p >= 50 ? "#9a6700" : BRAND;
      h += `<div onclick="window.tddOpen(${idx})" style="padding:8px 4px;border-top:1px solid #f2f2f2;cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <b>${r.name}</b><span><b>${d.n}</b><span style="color:#999">/${d.t}</span> · <b style="color:${c}">${p}%</b> <span style="color:#bbb">▾</span></span></div>
        <div style="height:8px;background:#f3e2e6;border-radius:1000px;margin-top:6px;overflow:hidden">
          <div style="height:100%;width:${Math.min(p, 100)}%;background:${c};border-radius:1000px"></div></div></div>
        <div id="tdd-d${idx}"></div>`;
    });
    body.innerHTML = h + "</div>";
    OPEN.forEach((idx) => {
      const box = $("tdd-d" + idx), r = out[idx];
      if (box && r && r.ok) box.innerHTML = detailHTML(r);
    });
  }

  $("tdd-go").onclick = () => scan().catch((e) => say("Lỗi: " + (e.message || e) + " — thử tải lại trang rồi bấm lại."));
  $("tdd-copy").onclick = () => {
    if (!LAST.length) return alert("Chưa có kết quả, quét trước đã.");
    const t = LAST.map((r) => {
      if (!r.ok) return `${r.name}: ${r.note}`;
      const d = dispOf(r);
      return `${r.name}: ${d.n}/${d.t}`;
    }).join("\n");
    navigator.clipboard.writeText(`ĐIỂM DANH TAMMI ${new Date().toLocaleString("vi-VN")}\n${t}`).then(() => alert("Đã copy!"));
  };
  $("tdd-push").onclick = async () => {
    const u = $("tdd-url").value.trim(), k = $("tdd-key").value.trim();
    if (!u || !k || !LAST.length) return alert("Nhập Supabase URL + anon key, và quét trước đã.");
    try { localStorage.tdd_supa_url = u; localStorage.tdd_supa_key = k; } catch (e) {}
    say("Đang đẩy lên Supabase…");
    const H = { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json" };
    const vn = new Date(new Date().getTime() + 7 * 3600 * 1000);
    const date = vn.toISOString().slice(0, 10), hour = vn.getUTCHours();
    for (const r of LAST.filter((x) => x.ok)) {
      await fetch(u + "/rest/v1/classes", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ group_id: r.gid, class_name: r.name }) });
      const cres = await (await fetch(u + `/rest/v1/classes?group_id=eq.${r.gid}&select=id`, { headers: H })).json();
      const cid = cres[0] && cres[0].id;
      if (!cid) continue;
      const d = dispOf(r);
      await fetch(u + "/rest/v1/snapshots_hourly", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ class_id: cid, date, hour, message_id: r.msgId, message_time: new Date(r.msgTime).toISOString(), reaction_count: r.rc, interacted_count: d.n }) });
    }
    for (const e of getEx()) {
      await fetch(u + "/rest/v1/excluded_users", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ user_id: e.id, name_match: e.name, reason: "bookmarklet" }) });
    }
    await fetch(u + "/rest/v1/heartbeat", { method: "POST", headers: H, body: JSON.stringify({ status: "ok", detail: "bookmarklet " + date + " " + hour + "h" }) });
    say("Đã đẩy xong lên Supabase ✓");
  };
  console.log("[tdd] panel sẵn sàng — tự quét ngay.");
  try {
    const uf = sessionStorage.tdd_updated_from;
    if (uf && uf !== TDD_VER) say(`Đã cập nhật v${uf} → <b>v${TDD_VER}</b> ✓ — đang quét lại…`);
    sessionStorage.removeItem("tdd_updated_from");
  } catch (e) {}
  setTimeout(() => scan().catch((e) => say("Lỗi: " + (e.message || e) + " — thử tải lại trang rồi bấm lại.")), 600);
})();
