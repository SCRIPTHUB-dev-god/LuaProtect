const PY_ENGINE = `B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~'"
B91_MAP = {}
for _i, _c in enumerate(B91_CHARS):
    B91_MAP[_c] = _i
def base91_encode(data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    b = 0
    n = 0
    out = []
    for byte in data:
        b = b | (byte << n)
        n = n + 8
        if n > 13:
            v = b & 8191
            if v > 88:
                b = b >> 13
                n = n - 13
            else:
                v = b & 16383
                b = b >> 14
                n = n - 14
            out.append(B91_CHARS[v % 91])
            out.append(B91_CHARS[v // 91])
    if n > 0:
        out.append(B91_CHARS[b % 91])
        if n > 7 or b > 90:
            out.append(B91_CHARS[b // 91])
    return "".join(out)
def base91_decode(text):
    v = -1
    b = 0
    n = 0
    out = bytearray()
    for ch in text:
        if ch not in B91_MAP:
            continue
        p = B91_MAP[ch]
        if v < 0:
            v = p
        else:
            v = v + p * 91
            b = b | (v << n)
            if (v & 8191) > 88:
                n = n + 13
            else:
                n = n + 14
            while n >= 8:
                out.append(b & 255)
                b = b >> 8
                n = n - 8
            v = -1
    if v >= 0:
        out.append((b | (v << n)) & 255)
    return bytes(out)
def b91_name(n):
    name = ""
    value = n + 1
    while value > 0:
        name = B91_CHARS[value % 91] + name
        value = value // 91
    return "_v" + name
def remove_comments(code):
    result = ""
    i = 0
    while i < len(code):
        if code[i:i + 2] == "--":
            while i < len(code) and code[i] != chr(10):
                i = i + 1
        else:
            result = result + code[i]
            i = i + 1
    return result
def rename_locals(code):
    found = {}
    counter = 0
    out = ""
    i = 0
    while i < len(code):
        if code[i:i + 5] == "local" and (i + 5 >= len(code) or not (code[i + 5].isalnum() or code[i + 5] == "_")):
            out = out + "local"
            i = i + 5
            while i < len(code) and code[i] == " ":
                out = out + code[i]
                i = i + 1
            start = i
            while i < len(code) and (code[i].isalnum() or code[i] == "_"):
                i = i + 1
            name = code[start:i]
            if name and name not in found:
                counter = counter + 1
                found[name] = b91_name(counter)
            out = out + found.get(name, name)
        elif code[i].isalpha() or code[i] == "_":
            start = i
            while i < len(code) and (code[i].isalnum() or code[i] == "_"):
                i = i + 1
            word = code[start:i]
            out = out + found.get(word, word)
        else:
            out = out + code[i]
            i = i + 1
    return out
def encode_strings(code):
    out = ""
    i = 0
    while i < len(code):
        if code[i] == chr(34):
            j = i + 1
            inner = ""
            while j < len(code) and code[j] != chr(34):
                inner = inner + code[j]
                j = j + 1
            out = out + "_B91D(" + chr(34) + base91_encode(inner) + chr(34) + ")"
            i = j + 1
        else:
            out = out + code[i]
            i = i + 1
    return out
def build_lph_cff(blocks):
    lines = []
    lines.append("local _LPH = 1")
    lines.append("while true do")
    lines.append("if _LPH == 0 then")
    lines.append("break")
    for index, block in enumerate(blocks):
        kind = block[0]
        body = block[1]
        lines.append("elseif _LPH == " + str(index + 1) + " then")
        lines.append("local _KIND = " + chr(34) + kind + chr(34))
        lines.append(body)
        lines.append("_LPH = " + str(index + 2))
    lines.append("end")
    lines.append("end")
    return chr(10).join(lines)
LUAU_RUNTIME = '''
--[[ Luau Runtime ]]
local _B91C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~'"
local _B91M = {}
for _i = 1, #_B91C do
    _B91M[string.sub(_B91C, _i, _i)] = _i - 1
end
local function _B91D(s)
    local _v = -1
    local _b = 0
    local _n = 0
    local _o = {}
    for _i = 1, #s do
        local _p = _B91M[string.sub(s, _i, _i)]
        if _p then
            if _v < 0 then
                _v = _p
            else
                _v = _v + _p * 91
                _b = _b + _v * (2 ^ _n)
                if (_v % 8192) > 88 then
                    _n = _n + 13
                else
                    _n = _n + 14
                end
                while _n >= 8 do
                    table.insert(_o, string.char(_b % 256))
                    _b = math.floor(_b / 256)
                    _n = _n - 8
                end
                _v = -1
            end
        end
    end
    if _v >= 0 then
        table.insert(_o, string.char((_b + _v * (2 ^ _n)) % 256))
    end
    return table.concat(_o)
end
local _LPH = 1
while true do
    if _LPH == 0 then
        break
    elseif _LPH == 1 then
        _LPH = 2
    elseif _LPH == 2 then
        _LPH = 3
    elseif _LPH == 3 then
        _LPH = 0
    end
end
'''
def obfuscate(code):
    cleaned = remove_comments(code)
    renamed = rename_locals(cleaned)
    encoded = encode_strings(renamed)
    minified = " ".join(encoded.split())
    function_block = ("function", minified)
    do_block = ("do", "do " + minified + " end")
    for_block = ("for", "for _i = 1, 1 do " + minified + " end")
    blocks = [function_block, do_block, for_block]
    flat = build_lph_cff(blocks)
    return flat + chr(10) + chr(10) + LUAU_RUNTIME
`;
const B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~'";
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
function b91Name(n) {
  let name = "";
  let value = n + 1;
  while (value > 0) {
    name = B91_CHARS[value % 91] + name;
    value = Math.floor(value / 91);
  }
  return "_v" + name;
}
function removeComments(code) {
  let result = "";
  let i = 0;
  while (i < code.length) {
    if (code[i] === "-" && code[i + 1] === "-") {
      while (i < code.length && code[i] !== String.fromCharCode(10)) {
        i = i + 1;
      }
    } else {
      result = result + code[i];
      i = i + 1;
    }
  }
  return result;
}
function isNameChar(ch) {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || (ch >= "0" && ch <= "9") || ch === "_";
}
function isNameStart(ch) {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}
function renameLocals(code) {
  const found = {};
  let counter = 0;
  let out = "";
  let i = 0;
  while (i < code.length) {
    if (code.slice(i, i + 5) === "local" && (i + 5 >= code.length || !isNameChar(code[i + 5]))) {
      out = out + "local";
      i = i + 5;
      while (i < code.length && code[i] === " ") {
        out = out + code[i];
        i = i + 1;
      }
      const start = i;
      while (i < code.length && isNameChar(code[i])) {
        i = i + 1;
      }
      const name = code.slice(start, i);
      if (name && !(name in found)) {
        counter = counter + 1;
        found[name] = b91Name(counter);
      }
      out = out + (found[name] || name);
    } else if (isNameStart(code[i])) {
      const start = i;
      while (i < code.length && isNameChar(code[i])) {
        i = i + 1;
      }
      const word = code.slice(start, i);
      out = out + (found[word] || word);
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
        inner = inner + code[j];
        j = j + 1;
      }
      out = out + "_B91D(" + String.fromCharCode(34) + base91Encode(inner) + String.fromCharCode(34) + ")";
      i = j + 1;
    } else {
      out = out + code[i];
      i = i + 1;
    }
  }
  return out;
}
function cffLPH(blocks) {
  const lines = [];
  lines.push("local _LPH = 1");
  lines.push("while true do");
  lines.push("if _LPH == 0 then");
  lines.push("break");
  for (let index = 0; index < blocks.length; index++) {
    const kind = blocks[index][0];
    const body = blocks[index][1];
    lines.push("elseif _LPH == " + (index + 1));
    lines.push("local _KIND = " + String.fromCharCode(34) + kind + String.fromCharCode(34));
    lines.push(body);
    lines.push("_LPH = " + (index + 2));
  }
  lines.push("end");
  lines.push("end");
  return lines.join(String.fromCharCode(10));
}
const LUAU_RUNTIME = `--[[ Luau Runtime ]]
local _B91C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~'"
local _B91M = {}
for _i = 1, #_B91C do
    _B91M[string.sub(_B91C, _i, _i)] = _i - 1
end
local function _B91D(s)
    local _v = -1
    local _b = 0
    local _n = 0
    local _o = {}
    for _i = 1, #s do
        local _p = _B91M[string.sub(s, _i, _i)]
        if _p then
            if _v < 0 then
                _v = _p
            else
                _v = _v + _p * 91
                _b = _b + _v * (2 ^ _n)
                if (_v % 8192) > 88 then
                    _n = _n + 13
                else
                    _n = _n + 14
                end
                while _n >= 8 do
                    table.insert(_o, string.char(_b % 256))
                    _b = math.floor(_b / 256)
                    _n = _n - 8
                end
                _v = -1
            end
        end
    end
    if _v >= 0 then
        table.insert(_o, string.char((_b + _v * (2 ^ _n)) % 256))
    end
    return table.concat(_o)
end
local _LPH = 1
while true do
    if _LPH == 0 then
        break
    elseif _LPH == 1 then
        _LPH = 2
    elseif _LPH == 2 then
        _LPH = 3
    elseif _LPH == 3 then
        _LPH = 0
    end
end
`;
function obfuscate(code) {
  const cleaned = removeComments(code);
  const renamed = renameLocals(cleaned);
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
  const blocks = [["function", minified], ["do", "do " + minified + " end"], ["for", "for _i = 1, 1 do " + minified + " end"]];
  const flat = cffLPH(blocks);
  return flat + String.fromCharCode(10) + String.fromCharCode(10) + LUAU_RUNTIME;
}
async function importPy() {
  if (window.loadPyodide) {
    try {
      const pyodide = await window.loadPyodide();
      pyodide.runPython(PY_ENGINE);
      const obfuscatePy = pyodide.globals.get("obfuscate");
      if (obfuscatePy) {
        return obfuscatePy;
      }
    } catch (e) {
    }
  }
  return null;
}
async function runObfus(code) {
  const pyObfuscate = await importPy();
  if (pyObfuscate) {
    try {
      return pyObfuscate(code);
    } catch (e) {
    }
  }
  return obfuscate(code);
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
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
  copyBtn.textContent = "Copied";
  setTimeout(function () {
    copyBtn.textContent = "Copy Output";
  }, 1200);
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