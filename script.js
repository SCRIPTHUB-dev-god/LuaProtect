const OBFUS_PY_URL = 'obfus.py';
const OBFUS_PY_EMBED = `...engine code...`;
async function loadObfusPy() { const res = await fetch(OBFUS_PY_URL); return await res.text(); }
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const navItems = document.querySelectorAll(".nav-item");
const panels = document.querySelectorAll(".tab-panel");
const inputCode = document.getElementById("inputCode");
const outputCode = document.getElementById("outputCode");
const protectBtn = document.getElementById("protectBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}
function toggleSidebar() {
  sidebar.classList.toggle("open");
  refreshIcons();
}
function showTab(tabName) {
  navItems.forEach(function (item) {
    item.classList.toggle("active", item.dataset.tab === tabName);
  });
  panels.forEach(function (panel) {
    panel.classList.toggle("active", panel.id === tabName);
  });
  sidebar.classList.remove("open");
  refreshIcons();
}
async function runObfus(code) {
  let source = OBFUS_PY_EMBED;
  try {
    source = await loadObfusPy();
  } catch (e) {
    source = OBFUS_PY_EMBED;
  }
  if (source && window.ObfusEngine && window.ObfusEngine.obfuscate) {
    return window.ObfusEngine.obfuscate(code);
  }
  return code;
}
async function protect() {
  const raw = inputCode.value.trim();
  if (!raw) {
    outputCode.textContent = "Paste Luau code first.";
    return;
  }
  outputCode.textContent = await runObfus(raw);
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
refreshIcons();
if (window.lucide) lucide.createIcons();