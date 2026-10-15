/* NÚT ĐIỂM DANH TAMMI v1 — chạy ngay trên trang tammi.vn đang login.
 * Cách chạy: F12 → Console → paste toàn bộ file → Enter.
 * Nó tự quét các nhóm "chi đoàn", đếm tim (mã 71) tin TRƯƠNG KHẮC NAM hôm nay,
 * vẽ bảng nổi đúng style Tammi (trắng + đỏ #EE0033 + pill). Muốn lưu thì nhập
 * Supabase URL + anon key rồi bấm "Lưu + Đẩy lên Supabase".
 */
(function () {
  var l = document.getElementById("tdd-load");
  if (l) l.remove();
  if (document.getElementById("tdiemdanh")) { document.getElementById("tdiemdanh").remove(); return; }
  const BRAND = "#EE0033", INK = "#1d1d1d";
  const css = `font-family:"Sans Flex",system-ui,sans-serif`;
  const root = document.createElement("div");
  root.id = "tdiemdanh";
  root.style.cssText = `position:fixed;z-index:999999;top:16px;right:16px;width:560px;max-width:92vw;max-height:86vh;display:flex;flex-direction:column;background:#fff;color:${INK};border-radius:20px;box-shadow:0 16px 50px rgba(0,0,0,.35);overflow:hidden;${css}`;
  root.innerHTML = `
    <div style="background:${BRAND};color:#fff;padding:12px 16px;font-weight:800;font-size:15px;display:flex;justify-content:space-between;align-items:center">
      <span>◈ ĐIỂM DANH TAMMI · THPT LỘC NINH</span>
      <button id="tdd-x" style="border:0;background:rgba(255,255,255,.25);color:#fff;border-radius:1000px;width:28px;height:28px;cursor:pointer;font-weight:800">✕</button>
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
    </div>
    <div id="tdd-body" style="padding:8px 16px;overflow:auto;font-size:13px"></div>`;
  document.body.appendChild(root);
  document.getElementById("tdd-x").onclick = () => root.remove();
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
  function isEx(id, nm) {
    const U = String(nm || "").toUpperCase();
    return getEx().some((e) => (e.id && e.id === id) || (e.name && U.includes(String(e.name).toUpperCase())));
  }
  window.tddExAdd = (id, nm) => {
    const a = getEx();
    if (!a.some((e) => e.id === id)) a.push({ id: id || null, name: nm || null });
    setEx(a); if (LAST.length) render(LAST);
  };
  window.tddExDel = (i) => { const a = getEx(); a.splice(i, 1); setEx(a); if (LAST.length) render(LAST); };
  window.tddExAddByName = () => {
    const v = ($("tdd-exname") || {}).value;
    if (v && v.trim()) { const a = getEx(); a.push({ id: null, name: v.trim() }); setEx(a); render(LAST); }
  };
  function netOf(r) {
    const mem = r.members.filter((m) => !isEx(m.id, m.name));
    const rea = r.reactors.filter((id) => !isEx(id, r.names[id]));
    return { n: rea.length, t: mem.length, reaIds: rea, mem };
  }

  function zim() {
    const z = window.__zimInstance || (window.ZIM && window.ZIM.getInstance && window.ZIM.getInstance());
    if (!z) throw new Error("Không thấy phiên ZIM trong trang. Hãy tải lại tammi.vn rồi thử lại.");
    return z;
  }
  function senderOf(m) {
    try { const e = m.extendedData ? JSON.parse(m.extendedData) : {}; if (e.senderName) return e.senderName; } catch (x) {}
    return m.senderUserID || "?";
  }
  async function reactors(z, target, rt) {
    let ids = (((target.reactions || []).find((r) => r.reactionType === rt) || {}).userList || []).map((u) => u.userID);
    let nf = 0;
    for (let i = 0; i < 12; i++) {
      const r = await z.queryMessageReactionUserList(target, { reactionType: rt, count: 50, nextFlag: nf });
      for (const u of r.userList || []) { const id = u.userID || u.userId; if (id && !ids.includes(id)) ids.push(id); }
      if (!r.nextFlag) break;
      nf = r.nextFlag;
    }
    return [...new Set(ids)];
  }

  async function scan() {
    const z = zim();
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
    let i = 0;
    for (const g of groups) {
      i++;
      say(`Đang quét ${i}/${groups.length}: <b>${g.conversationName}</b>… (đã xong ${out.filter((r) => r.ok).length})`); setBar(i / groups.length * 0.9);
      try {
        const h = await z.queryHistoryMessage(g.conversationID, 2, { count: 30, reverse: true });
        const list = h.messageList || [];
        const t = list.find((m) => { const s = senderOf(m).toUpperCase(); return (s.includes("TRƯƠNG KHẮC NAM") || s.includes("TRUONG KHAC NAM")) && m.timestamp >= day.getTime(); })
          || list.find((m) => { const s = senderOf(m).toUpperCase(); return s.includes("TRƯƠNG KHẮC NAM") || s.includes("TRUONG KHAC NAM"); });
        if (!t) { out.push({ name: g.conversationName, ok: false, note: "chưa có tin hôm nay" }); render(out); continue; }
        const rts = [...new Set((t.reactions || []).map((r) => r.reactionType))];
        let all = [];
        for (const rt of (rts.length ? rts : ["71"])) all.push(...await reactors(z, t, rt));
        all = [...new Set(all)];
        const members = [], names = {};
        try {
          let n = 0;
          for (let p = 0; p < 5; p++) {
            const m = await z.queryGroupMemberList(g.conversationID, { count: 100, nextFlag: n });
            for (const u of (m.groupMemberList || m.memberList || m.userList || [])) {
              const id = u.userID || u.userId || u.id;
              const nm = u.userName || u.nickname || id;
              if (id) { members.push({ id, name: nm }); names[id] = nm; }
            }
            if (!m.nextFlag) break; n = m.nextFlag;
          }
        } catch (e) {}
        const rc = (t.reactions || []).reduce((s, r) => s + (r.totalCount || 0), 0);
        out.push({ name: g.conversationName, gid: g.conversationID, ok: true, reactors: all, members, names, rc, msgId: t.messageID, msgTime: t.timestamp });
      } catch (e) { out.push({ name: g.conversationName, ok: false, note: e.message || "lỗi" }); }
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
    const r = LAST[idx];
    if (!r || !r.ok) return;
    const box = $("tdd-d" + idx);
    if (!box) return;
    if (box.innerHTML) { box.innerHTML = ""; return; }
    const v = netOf(r);
    const inSet = new Set(v.reaIds);
    const yes = [], no = [];
    v.mem.forEach((m) => ((inSet.has(m.id) ? yes : no).push(m)));
    const li = (m) => `<span style="display:inline-block;background:#f6f0f1;border-radius:1000px;padding:3px 6px 3px 10px;margin:2px;font-size:12px">${m.name} <button onclick="event.stopPropagation();window.tddExAdd('${m.id}','${String(m.name || "").replace(/'/g, "")}')" title="Loại người này" style="border:0;background:${BRAND};color:#fff;border-radius:1000px;width:18px;height:18px;cursor:pointer;font-size:11px">×</button></span>`;
    box.innerHTML = `<div style="background:#faf7f8;border-radius:12px;padding:8px 10px;margin:2px 0 8px">
      <div style="font-weight:800;color:#1a7f37;margin:4px 0">✓ ĐÃ TƯƠNG TÁC (${yes.length})</div>
      <div>${yes.length ? yes.map(li).join("") : "<span style='color:#999'>—</span>"}</div>
      <div style="font-weight:800;color:${BRAND};margin:8px 0 4px">✗ CHƯA TƯƠNG TÁC (${no.length})</div>
      <div>${no.length ? no.map(li).join("") : "<span style='color:#999'>—</span>"}</div>
      <div style="color:#999;font-size:11px;margin-top:6px">Bấm × ở tên để loại người đó khỏi thống kê.</div></div>`;
  };

  function render(out) {
    const body = $("tdd-body");
    const good = out.filter((r) => r.ok);
    let sumN = 0, sumT = 0;
    good.forEach((r) => { const v = netOf(r); sumN += v.n; sumT += v.t; });
    const exN = getEx().length;
    const pct = sumT ? Math.round(sumN / sumT * 1000) / 10 : 0;
    const passN = good.filter((r) => { const v = netOf(r); return v.t && v.n / v.t >= 0.7; }).length;
    const col = pct >= 70 ? "#1a7f37" : pct >= 50 ? "#9a6700" : BRAND;
    const card = (label, val, sub) => `<div style="flex:1;background:#faf7f8;border:1px solid #f0dfe3;border-radius:14px;padding:8px 10px;min-width:0">
      <div style="font-size:11px;color:#888">${label}</div>
      <div style="font-size:20px;font-weight:800">${val}</div>
      <div style="font-size:11px;color:#888">${sub}</div></div>`;
    let h = `<div style="display:flex;gap:8px;margin:4px 0 10px">
      ${card("Đã tương tác", sumN + "<span style='color:#999;font-size:13px'>/" + sumT + "</span>", exN ? "đã trừ " + exN + " người" : "tổng 39 nhóm")}
      ${card("Tỉ lệ chung", `<span style="color:${col}">${pct}%</span>`, "chuẩn đạt ≥ 70%")}
      ${card("Lớp đạt", passN + "<span style='color:#999;font-size:13px'>/" + good.length + "</span>", (out.length - good.length) ? (out.length - good.length) + " nhóm lỗi" : "quét sạch")}</div>`;
    h += `<details style="margin-bottom:8px"><summary style="cursor:pointer;font-size:12px;color:#666">Loại trừ (${exN} người) — bấm để xem/sửa</summary>
      <div style="display:flex;gap:6px;margin:6px 0"><input id="tdd-exname" placeholder="Tên hoặc user_id cần loại…" style="flex:1;border:1px solid #ddd;border-radius:1000px;padding:6px 12px">
      <button onclick="window.tddExAddByName()" style="border:0;background:#111;color:#fff;border-radius:1000px;padding:6px 14px;cursor:pointer">+ Thêm</button></div>
      <div>${getEx().map((e, i) => `<span style="display:inline-block;background:#eee;border-radius:1000px;padding:3px 6px 3px 10px;margin:2px;font-size:12px">${e.name || e.id} <button onclick="window.tddExDel(${i})" style="border:0;background:#999;color:#fff;border-radius:1000px;width:18px;height:18px;cursor:pointer">×</button></span>`).join("") || "<span style='color:#999;font-size:12px'>Chưa loại ai</span>"}</div></details>`;
    h += `<div style="display:flex;gap:6px;margin-bottom:8px">
      ${["all", "fail", "pass"].map((f) => `<button onclick="window.tddFilter('${f}')" style="border:0;border-radius:1000px;padding:6px 14px;cursor:pointer;font-weight:700;font-size:12px;${FILTER === f ? `background:${BRAND};color:#fff` : "background:#f3e2e6;color:#7a4a52"}">${f === "all" ? "Tất cả" : f === "fail" ? "Chưa đạt" : "Đã đạt"}</button>`).join("")}
      <span style="font-size:11px;color:#999;align-self:center">Bấm vào lớp để xem từng người</span></div>`;
    h += `<div>`;
    out.forEach((r, idx) => {
      if (!r.ok) {
        if (FILTER === "pass") return;
        h += `<div style="padding:8px 4px;border-top:1px solid #f2f2f2;color:#999">${r.name} — ${r.note}</div>`; return;
      }
      const v = netOf(r);
      const p = v.t ? Math.round(v.n / v.t * 1000) / 10 : 0;
      if (FILTER === "fail" && p >= 70) return;
      if (FILTER === "pass" && p < 70) return;
      const c = p >= 70 ? "#1a7f37" : p >= 50 ? "#9a6700" : BRAND;
      h += `<div onclick="window.tddOpen(${idx})" style="padding:8px 4px;border-top:1px solid #f2f2f2;cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <b>${r.name}</b><span><b>${v.n}</b><span style="color:#999">/${v.t}</span> · <b style="color:${c}">${p}%</b> <span style="color:#bbb">▾</span></span></div>
        <div style="height:8px;background:#f3e2e6;border-radius:1000px;margin-top:6px;overflow:hidden">
          <div style="height:100%;width:${Math.min(p, 100)}%;background:${c};border-radius:1000px"></div></div></div>
        <div id="tdd-d${idx}"></div>`;
    });
    body.innerHTML = h + "</div>";
  }

  $("tdd-go").onclick = () => scan().catch((e) => say("Lỗi: " + (e.message || e) + " — thử tải lại trang rồi bấm lại."));
  $("tdd-copy").onclick = () => {
    if (!LAST.length) return alert("Chưa có kết quả, quét trước đã.");
    const t = LAST.map((r) => {
      if (!r.ok) return `${r.name}: ${r.note}`;
      const v = netOf(r);
      return `${r.name}: ${v.n}/${v.t}`;
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
      const v = netOf(r);
      await fetch(u + "/rest/v1/snapshots_hourly", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ class_id: cid, date, hour, message_id: r.msgId, message_time: new Date(r.msgTime).toISOString(), reaction_count: r.rc, interacted_count: v.n }) });
    }
    for (const e of getEx()) {
      await fetch(u + "/rest/v1/excluded_users", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ user_id: e.id, name_match: e.name, reason: "bookmarklet" }) });
    }
    await fetch(u + "/rest/v1/heartbeat", { method: "POST", headers: H, body: JSON.stringify({ status: "ok", detail: "bookmarklet " + date + " " + hour + "h" }) });
    say("Đã đẩy xong lên Supabase ✓");
  };
  console.log("[tdd] panel sẵn sàng — tự quét ngay.");
  setTimeout(() => scan().catch((e) => say("Lỗi: " + (e.message || e) + " — thử tải lại trang rồi bấm lại.")), 600);
})();
