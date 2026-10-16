// Sync 1 chiều: web/bookmarklet-check.js -> extension/page.js (+ cờ manual + header extension)
const fs = require("fs");
const path = require("path");
const dir = __dirname;
let s = fs.readFileSync(path.join(dir, "web", "bookmarklet-check.js"), "utf8");
s = s.replace(/^\/\*[\s\S]*?\*\//, "/* NUT DIEM DANH TAMMI - ban extension (chay o page world). " +
  "File nay do popup/inject goi. Dung sua tay: sua web/bookmarklet-check.js roi chay node sync-page.js. */");
const oldT = '(function () {\n  var l = document.getElementById("tdd-load");\n  if (l) l.remove();\n' +
  '  if (document.getElementById("tdiemdanh")) { document.getElementById("tdiemdanh").remove(); return; }';
const newT = '(function () {\n  var l = document.getElementById("tdd-load");\n  if (l) l.remove();\n' +
  "  var manual = !!window.__tdd_manual;\n  window.__tdd_manual = false;\n" +
  '  var p = document.getElementById("tdiemdanh");\n  if (p) { p.remove(); if (!manual) return; }';
if (!s.includes(oldT)) { console.error("TOGGLE NOT FOUND"); process.exit(1); }
s = s.replace(oldT, newT);
s = s.split('window.__tdd_kind = "bm"').join('window.__tdd_kind = "ext"');
fs.writeFileSync(path.join(dir, "extension", "page.js"), s);
console.log("synced page.js, bytes:", s.length);
