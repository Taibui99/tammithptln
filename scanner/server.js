"use strict";
/* Render worker: quét reaction Tammi mỗi giờ → Supabase. Chạy 24/7 (free + UptimeRobot).
 * ENV bắt buộc: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * ENV tùy chọn: PORT (default 10000), ADMIN_KEY (bảo vệ /scan tay),
 *   SCAN_FILTER (default "chi đoàn"), SENDER_KEYS (default "TRƯƠNG KHẮC NAM,TRUONG KHAC NAM"),
 *   REACTION_TYPES (default "71"), TAMMI_BRIDGE_DIR, TAMMI_DATA_DIR (/tmp trên Render)
 * Lấy token lần đầu: chạy import-session.js ở máy local rồi copy credentials.json
 *   vào Supabase > service_state key=tammi_tokens (xem OPS.md), hoặc POST /import (ADMIN_KEY).
 */
const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");

const PORT = Number(process.env.PORT || 10000);
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const SCAN_FILTER = (process.env.SCAN_FILTER || "chi đoàn").toLowerCase();
const SENDER_KEYS = (process.env.SENDER_KEYS || "TRƯƠNG KHẮC NAM,TRUONG KHAC NAM").split(",").map((s) => s.trim().toUpperCase());
const REACTION_TYPES = (process.env.REACTION_TYPES || "71").split(",").map((s) => s.trim());

// ---- tìm bridge hermes-tammi-plugin (local dev hoặc Render sau khi clone) ----
function findBridge() {
  const cands = [
    process.env.TAMMI_BRIDGE_DIR,
    path.join(__dirname, "lib-bridge"),
    path.join(__dirname, "..", "..", "tammi-test", "hermes-tammi-plugin", "bridge"),
    "/opt/render/project/src/tammi-dashboard/scanner/lib-bridge",
  ].filter(Boolean);
  for (const d of cands) {
    if (fs.existsSync(path.join(d, "tammiApi.js"))) return d;
  }
  throw new Error("Không tìm thấy bridge. Clone: git clone --depth 1 https://github.com/cuongdev/hermes-tammi-plugin.git <scanner>/lib-bridge-tmp && mv lib-bridge-tmp/bridge lib-bridge");
}
const BRIDGE = findBridge();
const { TammiApi, CredentialStore, AuthError } = require(path.join(BRIDGE, "tammiApi.js"));
const { ZimClient } = require(path.join(BRIDGE, "zimClient.js"));
const { createClient } = require("@supabase/supabase-js");

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const log = (...a) => console.log(new Date().toISOString(), ...a);

// ---- giờ Việt Nam (Render chạy UTC) ----
function vnNow(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t).value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, hour: Number(g("hour")) % 24, label: `${g("day")}/${g("month")} ${String(Number(g("hour")) % 24).padStart(2, "0")}:00` };
}
function vnDayStart(dateStr) {
  // 00:00 VN của dateStr (YYYY-MM-DD) → ms epoch
  return Date.parse(`${dateStr}T00:00:00+07:00`);
}

const state = { client: null, api: null, lastScan: null, lastStatus: "boot", lastError: null, scanning: false };

// ---- token: Supabase là nguồn chân lý (file local chỉ là cache) ----
async function loadTokensToStore(store) {
  const { data, error } = await supa.from("service_state").select("value").eq("key", "tammi_tokens").maybeSingle();
  if (error) throw error;
  const v = data && data.value;
  if (v && v.refresh_token) {
    store.save({ access_token: v.access_token || "", refresh_token: v.refresh_token, expiry_time_seconds: 0, refresh_expiry_time_seconds: v.refresh_expiry_time_seconds, device_id: v.device_id });
    if (v.device_id) store.save({ device_id: v.device_id });
    log("[token] nạp từ Supabase");
    return true;
  }
  const local = store.sync();
  if (local.refresh_token) { log("[token] dùng file local (lần đầu)"); return true; }
  return false;
}
async function persistTokens(store) {
  const d = store.sync();
  if (!d.refresh_token) return;
  await supa.from("service_state").upsert({ key: "tammi_tokens", value: { access_token: d.access_token || "", refresh_token: d.refresh_token, device_id: d.device_id, expiry_time_seconds: d.expiry_time_seconds, refresh_expiry_time_seconds: d.refresh_expiry_time_seconds }, updated_at: new Date().toISOString() }, { onConflict: "key" });
}
async function heartbeat(status, detail) {
  try { await supa.from("heartbeat").insert({ status, detail: String(detail || "").slice(0, 500) }); } catch (e) { log("[heartbeat] lỗi:", e.message); }
}

async function ensureClient() {
  if (state.client && state.client.state.loggedIn) return state.client;
  const api = new TammiApi(new CredentialStore());
  const has = await loadTokensToStore(api.store);
  if (!has) { const e = new AuthError("Chưa có token. Import 1 lần rồi chép vào service_state key=tammi_tokens."); state.lastStatus = "auth_dead"; state.lastError = e.message; throw e; }
  const client = new ZimClient({ api, log: { info() {}, warn: (...a) => log("[zim]", ...a), error: (...a) => log("[zim-ERR]", ...a) } });
  await client.start();
  await persistTokens(api.store); // refresh xoay vòng → cất ngay
  state.client = client; state.api = api;
  return client;
}

function senderOf(m) {
  try { const ext = m.extendedData ? JSON.parse(m.extendedData) : {}; if (ext.senderName) return ext.senderName; } catch {}
  return m.senderUserID || "?";
}
async function queryReactorIds(client, target, rt) {
  let users = [...( ((target.reactions || []).find((r) => r.reactionType === rt) || {}).userList || []).map((u) => u.userID)];
  let nf = 0;
  for (let p = 0; p < 12; p++) {
    const res = await client.zim.queryMessageReactionUserList(target, { reactionType: rt, count: 50, nextFlag: nf });
    for (const u of res.userList || []) { const id = u.userID || u.userId; if (id && !users.includes(id)) users.push(id); }
    if (!res.nextFlag) break;
    nf = res.nextFlag;
  }
  return [...new Set(users)];
}

async function scanOnce(opts = {}) {
  if (state.scanning) { log("[scan] đang chạy, bỏ qua"); return { skipped: true }; }
  state.scanning = true;
  const vn = vnNow();
  const targetDate = opts.date || vn.date;
  try {
    const client = await ensureClient();
    // lớp + exclude
    const [{ data: classes }, { data: excludes }] = await Promise.all([
      supa.from("classes").select("*"),
      supa.from("excluded_users").select("*"),
    ]);
    let classRows = classes || [];
    if (!classRows.length) {
      // lần đầu: tự phát hiện nhóm theo tên rồi insert (sĩ số nhập sau trên web)
      const convs = await client.conversations(200);
      const gs = convs.filter((c) => c.type === "group" && (c.name || "").toLowerCase().includes(SCAN_FILTER));
      for (const g of gs) {
        await supa.from("classes").upsert({ group_id: g.id, class_name: g.name, total_students: 0 }, { onConflict: "group_id" });
      }
      const r2 = await supa.from("classes").select("*");
      classRows = r2.data || [];
      log(`[scan] tự phát hiện ${classRows.length} nhóm`);
    }
    const dayStart = vnDayStart(targetDate);
    let done = 0, failed = 0;
    for (const cls of classRows) {
      try {
        const hist = await client.zim.queryHistoryMessage(cls.group_id, 2, { count: opts.historyCount || 30, reverse: true });
        const list = hist.messageList || [];
        const nams = list.filter((m) => SENDER_KEYS.some((k) => senderOf(m).toUpperCase().includes(k)) && m.timestamp >= dayStart);
        const target = nams[0];
        if (!target) { log(`[scan] ${cls.class_name}: chưa có tin hôm nay`); continue; }
        const rts = [...new Set((target.reactions || []).map((r) => r.reactionType))];
        const wanted = rts.length ? rts : REACTION_TYPES;
        let all = [];
        for (const rt of wanted) all.push(...await queryReactorIds(client, target, rt));
        all = [...new Set(all)];
        // tên (best effort)
        let nameMap = new Map();
        try {
          let nf2 = 0;
          for (let i = 0; i < 5; i++) {
            const r = await client.zim.queryGroupMemberList(cls.group_id, { count: 100, nextFlag: nf2 });
            for (const m of r.groupMemberList || r.memberList || r.userList || []) nameMap.set(m.userID || m.userId || m.id, m.userName || m.nickname);
            if (!r.nextFlag) break;
            nf2 = r.nextFlag;
          }
        } catch {}
        // trừ exclude (toàn trường + riêng lớp)
        const ex = (excludes || []).filter((e) => !e.class_id || e.class_id === cls.id);
        const isEx = (id) => ex.some((e) =>
          (e.user_id && e.user_id === id) ||
          (e.name_match && (nameMap.get(id) || "").toUpperCase().includes(e.name_match.toUpperCase())));
        const counted = all.filter((id) => !isEx(id));
        const reactionCount = (target.reactions || []).reduce((s, r) => s + (r.totalCount || 0), 0);
        await supa.from("snapshots_hourly").upsert({
          class_id: cls.id, date: targetDate, hour: opts.hour != null ? opts.hour : vn.hour,
          message_id: target.messageID, message_time: new Date(target.timestamp).toISOString(),
          reaction_count: reactionCount, interacted_count: counted.length,
        }, { onConflict: "class_id,date,hour" });
        done++;
      } catch (e) { failed++; log(`[scan] ${cls.class_name} lỗi:`, e.message || e); }
    }
    await persistTokens(state.api.store);
    state.lastScan = new Date().toISOString(); state.lastStatus = "ok"; state.lastError = null;
    await heartbeat("ok", `${targetDate} done=${done} failed=${failed}`);
    log(`[scan] xong ${targetDate}: ${done} ok, ${failed} lỗi`);
    return { done, failed };
  } catch (e) {
    state.lastError = e.message || String(e);
    state.lastStatus = e && e.name === "AuthError" ? "auth_dead" : "error";
    await heartbeat(state.lastStatus, state.lastError);
    log("[scan] FATAL:", state.lastError);
    if (e && e.name === "AuthError") { try { state.client && await state.client.stop(); } catch {} state.client = null; }
    throw e;
  } finally { state.scanning = false; }
}

// ---- HTTP: /health cho UptimeRobot, /scan tay (ADMIN_KEY), /import nạp token ----
function guard(req) {
  if (!ADMIN_KEY) return true;
  const q = url.parse(req.url, true).query;
  return q.key === ADMIN_KEY;
}
const server = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  const send = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  try {
    if (u.pathname === "/health") {
      const { data } = await supa.from("heartbeat").select("checked_at,status").order("checked_at", { ascending: false }).limit(1).maybeSingle().catch(() => ({ data: null }));
      return send(200, { ok: state.lastStatus !== "auth_dead", status: state.lastStatus, lastScan: state.lastScan, lastHeartbeat: data || null, lastError: state.lastError, time: new Date().toISOString() });
    }
    if (u.pathname === "/scan") {
      if (!guard(req)) return send(403, { error: "sai key" });
      const r = await scanOnce({ date: u.query.date, hour: u.query.hour != null ? Number(u.query.hour) : undefined, historyCount: u.query.historyCount ? Number(u.query.historyCount) : 30 });
      return send(200, { ok: true, ...r });
    }
    if (u.pathname === "/import" && req.method === "POST") {
      if (!guard(req)) return send(403, { error: "sai key" });
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        try {
          const j = JSON.parse(body);
          if (!j.refresh_token) return send(400, { error: "thiếu refresh_token" });
          await supa.from("service_state").upsert({ key: "tammi_tokens", value: { access_token: j.token || "", refresh_token: j.refresh_token, device_id: j.device_id, expiry_time_seconds: 0 }, updated_at: new Date().toISOString() }, { onConflict: "key" });
          state.client = null; // ép login lại bằng token mới ở lần quét tới
          try { await ensureClient(); await persistTokens(state.api.store); } catch (e) { return send(500, { error: e.message }); }
          return send(200, { ok: true });
        } catch (e) { return send(400, { error: e.message }); }
      });
      return;
    }
    return send(404, { error: "dùng /health, /scan?key=..., /import?key=... (POST)" });
  } catch (e) { return send(500, { error: e.message || String(e) }); }
});

// ---- cron mỗi giờ (phút 05) + chạy 1 phát lúc boot ----
function msToNextRun() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(5, 0, 0);
  if (next <= now) next.setHours(next.getHours() + 1);
  return next - now;
}
function schedule() {
  setTimeout(async () => {
    try { await scanOnce(); } catch {}
    setInterval(async () => { try { await scanOnce(); } catch {} }, 3600 * 1000);
  }, msToNextRun());
}
process.on("uncaughtException", (e) => {
  if (String((e && e.message) || "").includes("reading '1'")) return; // bug dọn dẹp SDK lúc logout
  log("uncaught:", e);
});

server.listen(PORT, async () => {
  log(`worker nghe :${PORT} · filter="${SCAN_FILTER}"`);
  schedule();
  try { await scanOnce(); } catch (e) { log("quét lúc boot lỗi (sẽ thử lại giờ tới):", e.message); }
});
