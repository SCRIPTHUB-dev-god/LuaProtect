const B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" + String.fromCharCode(39);
const B91_MAP = {};
for (let _i = 0; _i < B91_CHARS.length; _i++) {
  B91_MAP[B91_CHARS[_i]] = _i;
}
function base91Encode(data) {
  const bytes = new TextEncoder().encode(data);
  let b = 0;
  let n = 0;
  let out = "";
  for (const byte of bytes) {
    b = b | (byte << n);
    n = n + 8;
    if (n > 13) {
      let v = b & 8191;
      if (v > 88) {
        b = b >> 13;
        n = n - 13;
      } else {
        v = b & 16383;
        b = b >> 14;
        n = n - 14;
      }
      out = out + B91_CHARS[v % 91];
      out = out + B91_CHARS[Math.floor(v / 91)];
    }
  }
  if (n > 0) {
    out = out + B91_CHARS[b % 91];
    if (n > 7 || b > 90) {
      out = out + B91_CHARS[Math.floor(b / 91)];
    }
  }
  return out;
}
function base91Decode(text) {
  let v = -1;
  let b = 0;
  let n = 0;
  const out = [];
  for (const ch of text) {
    if (!(ch in B91_MAP)) {
      continue;
    }
    const p = B91_MAP[ch];
    if (v < 0) {
      v = p;
    } else {
      v = v + p * 91;
      b = b | (v << n);
      if ((v & 8191) > 88) {
        n = n + 13;
      } else {
        n = n + 14;
      }
      while (n >= 8) {
        out.push(b & 255);
        b = b >> 8;
        n = n - 8;
      }
      v = -1;
    }
  }
  if (v >= 0) {
    out.push((b | (v << n)) & 255);
  }
  return new TextDecoder().decode(new Uint8Array(out));
}
function xorEncrypt(text, key) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}
function generateRandomKey() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 4; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KEYWORDS = ["and", "break", "do", "else", "elseif", "end", "false", "for", "function", "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while", "print"];
function randomThree(used) {
  while (true) {
    let name = "";
    for (let k = 0; k < 3; k++) {
      name = name + LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    }
    if (!(name in used) && KEYWORDS.indexOf(name) < 0) {
      used[name] = true;
      return name;
    }
  }
}
function isNameChar(ch) {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || (ch >= "0" && ch <= "9") || ch === "_";
}
function isNameStart(ch) {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}
function parseParams(code, i, map, used, out) {
  out.push("(");
  i = i + 1;
  while (i < code.length && code[i] !== ")") {
    if (isNameStart(code[i])) {
      const start = i;
      while (i < code.length && isNameChar(code[i])) {
        i = i + 1;
      }
      const name = code.slice(start, i);
      if (!(name in map)) {
        map[name] = randomThree(used);
      }
      out.push(map[name]);
    } else {
      out.push(code[i]);
      i = i + 1;
    }
  }
  if (i < code.length && code[i] === ")") {
    out.push(")");
    i = i + 1;
  }
  return i;
}
function renameVars(code) {
  const map = {};
  const used = {};
  const out = [];
  let i = 0;
  function copySpaces() {
    while (i < code.length && (code[i] === " " || code[i] === String.fromCharCode(9) || code[i] === String.fromCharCode(10) || code[i] === String.fromCharCode(13))) {
      out.push(code[i]);
      i = i + 1;
    }
  }
  function readName() {
    const start = i;
    while (i < code.length && isNameChar(code[i])) {
      i = i + 1;
    }
    return code.slice(start, i);
  }
  function mapName(name) {
    if (!(name in map)) {
      map[name] = randomThree(used);
    }
    return map[name];
  }
  while (i < code.length) {
    const ch = code[i];
    if (ch === String.fromCharCode(34) || ch === String.fromCharCode(39)) {
      const quote = ch;
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === quote && code[j - 1] !== String.fromCharCode(92)) {
          break;
        }
        j = j + 1;
      }
      out.push(code.slice(i, j + 1));
      i = j + 1;
    } else if (ch === String.fromCharCode(91) && code[i + 1] === String.fromCharCode(91)) {
      let j = code.indexOf("]]", i + 2);
      if (j < 0) {
        j = code.length - 1;
      } else {
        j = j + 1;
      }
      out.push(code.slice(i, j + 1));
      i = j + 1;
    } else if (ch === String.fromCharCode(46) || ch === String.fromCharCode(58)) {
      out.push(ch);
      i = i + 1;
      while (i < code.length && code[i] === " ") {
        out.push(code[i]);
        i = i + 1;
      }
      const start = i;
      while (i < code.length && isNameChar(code[i])) {
        i = i + 1;
      }
      out.push(code.slice(start, i));
    } else if (isNameStart(ch)) {
      const start = i;
      while (i < code.length && isNameChar(code[i])) {
        i = i + 1;
      }
      const word = code.slice(start, i);
      if (word === "local") {
        out.push(word);
        copySpaces();
        if (code.slice(i, i + 8) === "function" && (i + 8 >= code.length || !isNameChar(code[i + 8]))) {
          out.push("function");
          i = i + 8;
          copySpaces();
          const fname = readName();
          if (fname) {
            out.push(mapName(fname));
          }
          copySpaces();
          if (i < code.length && code[i] === "(") {
            i = parseParams(code, i, map, used, out);
          }
        } else {
          while (true) {
            const nstart = i;
            while (i < code.length && isNameChar(code[i])) {
              i = i + 1;
            }
            const name = code.slice(nstart, i);
            if (!name) {
              break;
            }
            out.push(mapName(name));
            copySpaces();
            if (i < code.length && code[i] === ",") {
              out.push(",");
              i = i + 1;
              copySpaces();
              continue;
            }
            break;
          }
        }
      } else if (word === "function") {
        out.push(word);
        copySpaces();
        if (i < code.length && code[i] === "(") {
          i = parseParams(code, i, map, used, out);
        } else {
          const fname = readName();
          if (fname) {
            if (fname in map) {
              out.push(map[fname]);
            } else {
              out.push(fname);
            }
          }
          while (i < code.length && (code[i] === "." || code[i] === ":")) {
            out.push(code[i]);
            i = i + 1;
            copySpaces();
            const prop = readName();
            out.push(prop);
          }
          copySpaces();
          if (i < code.length && code[i] === "(") {
            i = parseParams(code, i, map, used, out);
          }
        }
      } else if (word === "for") {
        out.push(word);
        copySpaces();
        while (true) {
          const nstart = i;
          while (i < code.length && isNameChar(code[i])) {
            i = i + 1;
          }
          const name = code.slice(nstart, i);
          if (!name) {
            break;
          }
          out.push(mapName(name));
          copySpaces();
          if (i < code.length && code[i] === ",") {
            out.push(",");
            i = i + 1;
            copySpaces();
            continue;
          }
          if (code.slice(i, i + 2) === "in" && (i + 2 >= code.length || !isNameChar(code[i + 2]))) {
            out.push("in");
            i = i + 2;
          }
          break;
        }
      } else if (KEYWORDS.indexOf(word) >= 0) {
        out.push(word);
      } else if (word in map) {
        out.push(map[word]);
      } else {
        out.push(word);
      }
    } else {
      out.push(ch);
      i = i + 1;
    }
  }
  return out.join("");
}
function removeComments(code) {
  let out = "";
  let i = 0;
  while (i < code.length) {
    if (code[i] === "-" && code[i + 1] === "-") {
      if (code[i + 2] === "[" && code[i + 3] === "[") {
        const j = code.indexOf("]]", i + 4);
        if (j < 0) {
          break;
        }
        i = j + 2;
        out = out + String.fromCharCode(10);
      } else {
        while (i < code.length && code[i] !== String.fromCharCode(10)) {
          i = i + 1;
        }
        out = out + String.fromCharCode(10);
      }
    } else if (code[i] === String.fromCharCode(34) || code[i] === String.fromCharCode(39)) {
      const q = code[i];
      out = out + code[i];
      i = i + 1;
      while (i < code.length) {
        out = out + code[i];
        if (code[i] === q && code[i - 1] !== String.fromCharCode(92)) {
          i = i + 1;
          break;
        }
        i = i + 1;
      }
    } else if (code[i] === "[" && code[i + 1] === "[") {
      const j = code.indexOf("]]", i + 2);
      if (j < 0) {
        out = out + code.slice(i);
        break;
      }
      out = out + code.slice(i, j + 2);
      i = j + 2;
    } else {
      out = out + code[i];
      i = i + 1;
    }
  }
  return out;
}
function encodeStrings(code) {
  let out = "";
  let i = 0;
  while (i < code.length) {
    if (code[i] === String.fromCharCode(34)) {
      let j = i + 1;
      let inner = "";
      while (j < code.length && code[j] !== String.fromCharCode(34)) {
        if (code[j] === String.fromCharCode(92) && j + 1 < code.length) {
          inner = inner + code[j] + code[j + 1];
          j = j + 2;
        } else {
          inner = inner + code[j];
          j = j + 1;
        }
      }
      const key = generateRandomKey();
      const xored = xorEncrypt(inner, key);
      const b91 = base91Encode(xored);
      out = out + "_XOR(" + String.fromCharCode(34) + b91 + String.fromCharCode(34) + "," + String.fromCharCode(34) + key + String.fromCharCode(34) + ")";
      i = j + 1;
    } else if (code[i] === String.fromCharCode(39)) {
      let j = i + 1;
      let inner = "";
      while (j < code.length && code[j] !== String.fromCharCode(39)) {
        if (code[j] === String.fromCharCode(92) && j + 1 < code.length) {
          inner = inner + code[j] + code[j + 1];
          j = j + 2;
        } else {
          inner = inner + code[j];
          j = j + 1;
        }
      }
      const key = generateRandomKey();
      const xored = xorEncrypt(inner, key);
      const b91 = base91Encode(xored);
      out = out + "_XOR(" + String.fromCharCode(34) + b91 + String.fromCharCode(34) + "," + String.fromCharCode(34) + key + String.fromCharCode(34) + ")";
      i = j + 1;
    } else {
      out = out + code[i];
      i = i + 1;
    }
  }
  return out;
}
function makePadString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s = s + chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}
function makePadding() {
  const q = String.fromCharCode(34);
  const nl = String.fromCharCode(10);
  const padLen = 500 + Math.floor(Math.random() * 501);
  const safePad = makePadString(padLen).replace(/["']/g, "");
  return "local _pad = " + q + safePad + q + nl;
}
function splitOnePerLine(body) {
  const fixed = [];
  const parts = body.split(String.fromCharCode(10));
  for (const line of parts) {
    let rest = line;
    while (true) {
      const hit = rest.indexOf(") ");
      if (hit < 0) {
        fixed.push(rest);
        break;
      }
      const after = rest.slice(hit + 2);
      if (after.startsWith("local ") || /^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(after)) {
        fixed.push(rest.slice(0, hit + 1));
        rest = after;
      } else {
        fixed.push(rest);
        break;
      }
    }
  }
  return fixed;
}
function cffLPH(blocks) {
  const lines = [];
  lines.push("local _LPH = 1");
  lines.push("while true do");
  lines.push("if _LPH == 0 then");
  lines.push("break");
  for (let index = 0; index < blocks.length; index++) {
    const body = blocks[index][1];
    lines.push("elseif _LPH == " + (index + 1) + " then");
    for (const line of splitOnePerLine(body)) {
      lines.push(line);
    }
    if (index + 1 < blocks.length) {
      lines.push("_LPH = " + (index + 2));
    } else {
      lines.push("_LPH = 0");
    }
  }
  lines.push("else");
  lines.push("_LPH = 0");
  lines.push("end");
  lines.push("end");
  return lines.join(String.fromCharCode(10));
}

const LUAU_RUNTIME = [
  'local _B91C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" .. string.char(39)',
  'local _B91M = {}',
  'for _i = 1, #_B91C do',
  '    _B91M[string.sub(_B91C, _i, _i)] = _i - 1',
  'end',
  'local function _B91D(s)',
  '    local _v = -1',
  '    local _b = 0',
  '    local _n = 0',
  '    local _o = {}',
  '    for _i = 1, #s do',
  '        local _p = _B91M[string.sub(s, _i, _i)]',
  '        if _p then',
  '            if _v < 0 then',
  '                _v = _p',
  '            else',
  '                _v = _v + _p * 91',
  '                _b = _b + _v * (2 ^ _n)',
  '                if (_v % 8192) > 88 then',
  '                    _n = _n + 13',
  '                else',
  '                    _n = _n + 14',
  '                end',
  '                while _n >= 8 do',
  '                    table.insert(_o, string.char(_b % 256))',
  '                    _b = math.floor(_b / 256)',
  '                    _n = _n - 8',
  '                end',
  '                _v = -1',
  '            end',
  '        end',
  '    end',
  '    if _v >= 0 then',
  '        table.insert(_o, string.char((_b + _v * (2 ^ _n)) % 256))',
  '    end',
  '    return table.concat(_o)',
  'end',
  'local function _XOR(data, key)',
  '    local decoded = _B91D(data)',
  '    local res = {}',
  '    for i = 1, #decoded do',
  '        local b = string.byte(decoded, i)',
  '        local k = string.byte(key, ((i - 1) % #key) + 1)',
  '        table.insert(res, string.char(bit32 and bit32.bxor(b, k) or (b ~ k)))',
  '    end',
  '    return table.concat(res)',
  'end'
].join(String.fromCharCode(10));

// PANGGIL RENAMEVARS DI SINI AGAR VARIABEL DIUBAH MENJADI ACAK
function obfuscate(code) {
  const cleaned = removeComments(code);
  const renamed = renameVars(cleaned);
  const encoded = encodeStrings(renamed);
  const parts = [];
  let current = "";
  for (const ch of encoded) {
    if (ch === " " || ch === String.fromCharCode(10) || ch === String.fromCharCode(9) || ch === String.fromCharCode(13)) {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current = current + ch;
    }
  }
  if (current) {
    parts.push(current);
  }
  const minified = parts.join(" ");
  const blocks = [["function", minified]];
  const flat = cffLPH(blocks);
  const head = "local _big = " + String.fromCharCode(34) + makePadString(120) + String.fromCharCode(34) + String.fromCharCode(10);
  const tail = makePadding();
  return LUAU_RUNTIME + String.fromCharCode(10) + String.fromCharCode(10) + head + flat + String.fromCharCode(10) + String.fromCharCode(10) + tail;
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
  if (window.lucide) {
    lucide.createIcons();
  }
}
function toggleSidebar() {
  sidebar.classList.toggle("open");
  if (sidebarOverlay) {
    sidebarOverlay.classList.toggle("open");
  }
  refreshIcons();
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", toggleSidebar);
}
function showTab(tabName) {
  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.classList.remove("active");
  });
  document.querySelectorAll(".tab-panel").forEach(function (panel) {
    panel.classList.remove("active");
  });
  navItems.forEach(function (item) {
    item.classList.toggle("active", item.dataset.tab === tabName);
  });
  panels.forEach(function (panel) {
    panel.classList.toggle("active", panel.id === tabName);
  });
  sidebar.classList.remove("open");
  if (sidebarOverlay) {
    sidebarOverlay.classList.remove("open");
  }
  refreshIcons();
}
async function protect() {
  const raw = inputCode.value.trim();
  if (!raw) {
    outputCode.textContent = "Paste Luau code first.";
    return;
  }
  const result = obfuscate(raw);
  outputCode.textContent = result;
}
function clearAll() {
  inputCode.value = "";
  outputCode.textContent = "Waiting for input stream...";
  inputCode.focus();
}
function copyOutput() {
  const text = outputCode.textContent || "";
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
  copyBtn.textContent = "Copied to Clipboard";
  setTimeout(function () {
    copyBtn.textContent = "Copy Protected Output";
  }, 1200);
}
if (hamburger) {
  hamburger.addEventListener("click", toggleSidebar);
}
navItems.forEach(function (item) {
  item.addEventListener("click", function () {
    showTab(item.dataset.tab);
  });
});
if (protectBtn) protectBtn.addEventListener("click", protect);
if (clearBtn) clearBtn.addEventListener("click", clearAll);
if (copyBtn) copyBtn.addEventListener("click", copyOutput);
document.addEventListener("DOMContentLoaded", function () {
  refreshIcons();
});
refreshIcons();
