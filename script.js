
"use strict";

const CONFIG = {
  wrapInDo: true,
  encodeStrings: true,
  customPrint: true,
  rot47: true
};

function randomName(source, prefix) {
  let name;
  do {
    name = prefix + Math.random().toString(36).slice(2, 9);
  } while (source.includes(name));
  return name;
}

function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

function rot47(text) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 33 && code <= 126) {
      result += String.fromCharCode(((code - 33 + 47) % 94) + 33);
    } else {
      result += text[i];
    }
  }
  return result;
}

function transformSource(source, decoderName, printName) {
  let output = "";
  let i = 0;
  let previousWord = "";
  let previousChar = "";

  function readLongBracket(position) {
    if (source[position] !== "[") return null;
    let j = position + 1;
    while (source[j] === "=") j++;
    if (source[j] !== "[") return null;
    const equals = source.slice(position + 1, j);
    const close = "]" + equals + "]";
    const end = source.indexOf(close, j + 1);
    return { end: end < 0 ? source.length : end + close.length };
  }

  function readQuoted(position) {
    const quote = source[position];
    let j = position + 1;
    while (j < source.length) {
      if (source[j] === "\\") {
        j += 2;
        continue;
      }
      if (source[j] === quote) return j;
      j++;
    }
    return source.length - 1;
  }

  function append(value) {
    output += value;
    if (value.length > 0) {
      const last = value[value.length - 1];
      if (!/\s/.test(last)) previousChar = last;
    }
  }

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (ch === "-" && next === "-") {
      const longComment = readLongBracket(i + 2);
      if (longComment) {
        append(source.slice(i, longComment.end));
        i = longComment.end;
      } else {
        let end = i;
        while (end < source.length && source[end] !== "\n") end++;
        append(source.slice(i, end));
        i = end;
      }
      previousWord = "";
      continue;
    }

    if (ch === "[") {
      const longString = readLongBracket(i);
      if (longString) {
        append(source.slice(i, longString.end));
        i = longString.end;
        previousWord = "";
        continue;
      }
    }

    if (ch === '"' || ch === "'") {
      const end = readQuoted(i);
      const original = source.slice(i, end + 1);
      const inner = original.slice(1, -1);
      const safe = CONFIG.encodeStrings && CONFIG.rot47 &&
        !inner.includes("\\") && /^[\x20-\x7E]*$/.test(inner);

      if (safe) {
        append(decoderName + "(" + JSON.stringify(rot47(inner)) + ")");
      } else {
        append(original);
      }

      i = end + 1;
      previousWord = "";
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let end = i + 1;
      while (end < source.length && /[A-Za-z0-9_]/.test(source[end])) end++;

      const word = source.slice(i, end);
      let nextIndex = end;

      while (/\s/.test(source[nextIndex] || "")) nextIndex++;

      const isPrintCall = CONFIG.customPrint &&
        word === "print" &&
        source[nextIndex] === "(" &&
        previousChar !== "." &&
        previousChar !== ":" &&
        previousWord !== "function";

      append(isPrintCall ? printName : word);
      previousWord = word;
      i = end;
      continue;
    }

    append(ch);

    if (!/\s/.test(ch) && !/[A-Za-z0-9_]/.test(ch)) {
      previousWord = "";
    }

    i++;
  }

  return output;
}

function createRuntime(decoderName, printName) {
  const lines = [];

  if (CONFIG.encodeStrings && CONFIG.rot47) {
    lines.push("local function " + decoderName + "(s)");
    lines.push("local o = {}");
    lines.push("for i = 1, #s do");
    lines.push("local b = string.byte(s, i)");
    lines.push("if b >= 33 and b <= 126 then");
    lines.push("b = ((b - 33 + 47) % 94) + 33");
    lines.push("end");
    lines.push("o[i] = string.char(b)");
    lines.push("end");
    lines.push("return table.concat(o)");
    lines.push("end");
  }

  if (CONFIG.customPrint) {
    lines.push("");
    lines.push("local function " + printName + "(...)");
    lines.push("return print(...)");
    lines.push("end");
  }

  return lines.join("\n");
}

function obfuscate(code) {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Source code cannot be empty.");
  }

  if (code.length > 1000000) {
    throw new Error("Source exceeds the 1 MB limit.");
  }

  const decoderName = randomName(code, "_decode");
  const printName = randomName(code + decoderName, "_output");

  const runtime = createRuntime(decoderName, printName);
  const transformed = transformSource(code, decoderName, printName);

  const sections = [];

  sections.push(runtime);
  sections.push("");

  if (CONFIG.wrapInDo) {
    sections.push("do");
    sections.push(transformed);
    sections.push("end");
  } else {
    sections.push(transformed);
  }

  return sections.join("\n");
}

function updateStats(original, protectedCode) {
  const originalSize = byteLength(original);
  const protectedSize = byteLength(protectedCode);

  const overhead = originalSize > 0
    ? ((protectedSize - originalSize) / originalSize) * 100
    : 0;

  const origElement = document.getElementById("origBytes");
  const protElement = document.getElementById("protBytes");
  const growElement = document.getElementById("growPct");

  if (origElement) origElement.textContent = originalSize.toLocaleString();
  if (protElement) protElement.textContent = protectedSize.toLocaleString();
  if (growElement) growElement.textContent = overhead.toFixed(2) + "%";
}

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const navItems = document.querySelectorAll(".nav-item");
const panels = document.querySelectorAll(".tab-panel");
const inputCode = document.getElementById("inputCode");
const outputCode = document.getElementById("outputCode");
const protectBtn = document.getElementById("protectBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function toggleSidebar() {
  if (!sidebar) return;
  sidebar.classList.toggle("open");
  if (sidebarOverlay) sidebarOverlay.classList.toggle("open");
  refreshIcons();
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
  if (sidebarOverlay) sidebarOverlay.classList.remove("open");
}

function showTab(tabName) {
  navItems.forEach(function (item) {
    item.classList.toggle("active", item.dataset.tab === tabName);
  });

  panels.forEach(function (panel) {
    panel.classList.toggle("active", panel.id === tabName);
  });

  closeSidebar();
  refreshIcons();
}

async function protect() {
  if (!inputCode || !outputCode) return;

  const raw = inputCode.value;

  if (!raw.trim()) {
    outputCode.textContent = "Paste Luau code first.";
    updateStats("", "");
    return;
  }

  if (protectBtn) {
    protectBtn.disabled = true;
    protectBtn.textContent = "Compiling...";
  }

  try {
    const result = obfuscate(raw);
    outputCode.textContent = result;
    updateStats(raw, result);
  } catch (error) {
    outputCode.textContent = "Compilation failed: " + error.message;
  } finally {
    if (protectBtn) {
      protectBtn.disabled = false;
      protectBtn.innerHTML = '<i data-lucide="lock"></i>Secure & Compile';
    }
    refreshIcons();
  }
}

function clearAll() {
  if (inputCode) {
    inputCode.value = "";
    inputCode.focus();
  }

  if (outputCode) {
    outputCode.textContent = "Waiting for input stream...";
  }

  updateStats("", "");
  refreshIcons();
}

async function copyOutput() {
  if (!outputCode || !copyBtn) return;

  const text = outputCode.textContent || "";

  if (!text || text === "Waiting for input stream...") return;

  const originalLabel = "Copy Protected Output";

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();

      const success = document.execCommand("copy");
      document.body.removeChild(area);

      if (!success) throw new Error("Clipboard operation failed.");
    }

    copyBtn.textContent = "Copied to Clipboard";
  } catch (error) {
    copyBtn.textContent = "Copy Failed";
  }

  setTimeout(function () {
    copyBtn.innerHTML = '<i data-lucide="copy"></i>' + originalLabel;
    refreshIcons();
  }, 1500);
}

if (hamburger) hamburger.addEventListener("click", toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

navItems.forEach(function (item) {
  item.addEventListener("click", function () {
    showTab(item.dataset.tab);
  });
});

if (protectBtn) protectBtn.addEventListener("click", protect);
if (clearBtn) clearBtn.addEventListener("click", clearAll);
if (copyBtn) copyBtn.addEventListener("click", copyOutput);

refreshIcons();
updateStats("", "");
