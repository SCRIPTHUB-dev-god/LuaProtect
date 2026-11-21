// luau-pro project - script.js
// Hanya untuk di-copy ke editor. Jangan di-run di halaman ini.

function removeComments(code) {
  var out = String(code || "");
  out = out.replace(/--\[\[[\s\S]*?\]\]/g, "");
  out = out.replace(/--[^\n]*/g, "");
  return out;
}

function renameLocals(code) {
  var map = {};
  var next = 1;
  var renamed = String(code || "").replace(/local\s+([A-Za-z_][A-Za-z0-9_]*)/g, function (match, name) {
    if (!map[name]) map[name] = "_L" + (next++);
    return "local " + map[name];
  });
  Object.keys(map).forEach(function (name) {
    var re = new RegExp("\\b" + name + "\\b", "g");
    renamed = renamed.replace(re, map[name]);
  });
  return renamed;
}

function encodeStrings(code) {
  return String(code || "").replace(/"([^"]*)"/g, function (match, inner) {
    var nums = [];
    for (var i = 0; i < inner.length; i++) nums.push(inner.charCodeAt(i));
    return "string.char(" + nums.join(",") + ")";
  });
}

function minify(code) {
  return String(code || "")
    .replace(/\s+/g, " ")
    .replace(/\s*([=\+\-\*\/%,;:%(%){}%[%]] )\s*/g, "$1")
    .trim();
}

function protect() {
  var input = document.getElementById("inputCode");
  var output = document.getElementById("outputCode");
  var status = document.getElementById("status");
  var code = input.value;
  if (!code.trim()) {
    status.textContent = "Tempel kode Luau dulu.";
    return;
  }
  if (document.getElementById("optComments").checked) code = removeComments(code);
  if (document.getElementById("optRename").checked) code = renameLocals(code);
  if (document.getElementById("optStrings").checked) code = encodeStrings(code);
  if (document.getElementById("optMinify").checked) code = minify(code);
  output.value = code;
  status.textContent = "Protect selesai. Tekan Copy untuk menyalin hasil.";
}

function copyOutput() {
  var output = document.getElementById("outputCode");
  var status = document.getElementById("status");
  if (!output.value) {
    status.textContent = "Belum ada hasil untuk di-copy.";
    return;
  }
  output.select();
  document.execCommand("copy");
  status.textContent = "Hasil tersalin!";
}

function clearAll() {
  document.getElementById("inputCode").value = "";
  document.getElementById("outputCode").value = "";
  document.getElementById("status").textContent = "Dibersihkan. Siap untuk kode baru.";
}

function toggleMenu() {
  var btn = document.getElementById("hamburger");
  var menu = document.getElementById("menu");
  var open = btn.getAttribute("aria-expanded") !== "true";
  btn.setAttribute("aria-expanded", String(open));
  menu.hidden = !open;
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btnProtect").addEventListener("click", protect);
  document.getElementById("btnCopy").addEventListener("click", copyOutput);
  document.getElementById("btnClear").addEventListener("click", clearAll);
  document.getElementById("hamburger").addEventListener("click", toggleMenu);
});