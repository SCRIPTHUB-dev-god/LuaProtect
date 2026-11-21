const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const navItems = document.querySelectorAll(".nav-item");
const panels = document.querySelectorAll(".tab-panel");
const inputCode = document.getElementById("inputCode");
const outputCode = document.getElementById("outputCode");
const protectBtn = document.getElementById("protectBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
let counter = 0;
function toggleSidebar() {
  sidebar.classList.toggle("open");
}
function showTab(tabName) {
  navItems.forEach(function (item) {
    item.classList.toggle("active", item.dataset.tab === tabName);
  });
  panels.forEach(function (panel) {
    panel.classList.toggle("active", panel.id === tabName);
  });
  sidebar.classList.remove("open");
}
function removeComments(code) {
  let result = "";
  let i = 0;
  while (i < code.length) {
    if (code.slice(i, i + 2) === "--") {
      while (i < code.length && code[i] !== "\n") {
        i += 1;
      }
    } else {
      result += code[i];
      i += 1;
    }
  }
  return result;
}
function encodeStrings(code) {
  return code.replace(/"([^"\n]*)"/g, function (match, inner) {
    const bytes = [];
    for (let i = 0; i < inner.length; i += 1) {
      bytes.push("\\x" + inner.charCodeAt(i).toString(16).padStart(2, "0"));
    }
    return '"' + bytes.join("") + '"';
  });
}
function renameLocals(code) {
  const found = {};
  const pattern = /local\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  let match = pattern.exec(code);
  while (match !== null) {
    if (!found[match[1]]) {
      counter += 1;
      found[match[1]] = "_v" + counter;
    }
    match = pattern.exec(code);
  }
  Object.keys(found).forEach(function (name) {
    const safe = name.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
    const replacePattern = new RegExp("\\b" + safe + "\\b", "g");
    code = code.replace(replacePattern, found[name]);
  });
  return code;
}
function protect() {
  const raw = inputCode.value.trim();
  if (!raw) {
    outputCode.textContent = "Paste Luau code first.";
    return;
  }
  counter = 0;
  let result = removeComments(raw);
  result = renameLocals(result);
  result = encodeStrings(result);
  result = result.replace(/\s+/g, " ").trim();
  outputCode.textContent = result;
}
function clearAll() {
  inputCode.value = "";
  outputCode.textContent = "Your protected code will appear here.";
  inputCode.focus();
}
function copyOutput() {
  const text = outputCode.textContent || "";
  navigator.clipboard.writeText(text).then(function () {
    copyBtn.textContent = "Copied";
    setTimeout(function () {
      copyBtn.textContent = "Copy Output";
    }, 1200);
  });
}
hamburger.addEventListener("click", toggleSidebar);
navItems.forEach(function (item) {
  item.addEventListener("click", function () {
    showTab(item.dataset.tab);
  });
});
protectBtn.addEventListener("click", protect);
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", copyOutput);