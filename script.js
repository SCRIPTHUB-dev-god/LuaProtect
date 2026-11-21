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
    if (n > 7) {
      out.push(((b | (v << n)) >> 8) & 255);
    }
  }
  return new TextDecoder().decode(new Uint8Array(out));
}

function rot47(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 33 && c <= 126) {
      out += String.fromCharCode(33 + ((c - 33 + 47) % 94));
    } else {
      out += text.charAt(i);
    }
  }
  return out;
}

function xorEncrypt(text, key) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

function xorDecrypt(text, key) {
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

function generateAlphaKey(n) {
  const az = "abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < n; i++) s += az.charAt(Math.floor(Math.random() * 26));
  return s;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KEYWORDS = ["and", "break", "do", "else", "elseif", "end", "false", "for", "function", "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while", "print", "game", "loadstring"];

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

function generateNumericVarName(used) {
  while (true) {
    let name = "_" + generateAlphaKey(2) + Math.floor(Math.random() * 900 + 100);
    if (!(name in used)) {
      used[name] = true;
      return name;
    }
  }
}

function makeJunkDoBlocks() {
  const used = {};
  let out = "";
  for (let k = 0; k < 15; k++) {
    const aXq = generateNumericVarName(used);
    const bWq = generateNumericVarName(used);
    const cZq = generateNumericVarName(used);
    const dQw = generateNumericVarName(used);
    const eRt = generateNumericVarName(used);
    out += `do local ${aXq} = function() return "xQ9mZkP2" end local ${bWq} = function() return 12345 end local ${cZq} = ${aXq}() + ${bWq}() local ${dQw} = (12345 * 6789 + 111) % 9973 local ${eRt} = ${dQw} * 2 - ${dQw} if false then print(${aXq}()) end end\n`;
  }
  return out;
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

function replacePrint(code) {
  const out = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === String.fromCharCode(34) || ch === String.fromCharCode(39)) {
      const q = ch;
      out.push(ch);
      i = i + 1;
      while (i < code.length) {
        out.push(code[i]);
        if (code[i] === String.fromCharCode(92) && i + 1 < code.length) {
          out.push(code[i + 1]);
          i = i + 2;
          continue;
        }
        if (code[i] === q) {
          i = i + 1;
          break;
        }
        i = i + 1;
      }
      continue;
    }
    if (ch === "[" && code[i + 1] === "[") {
      const j = code.indexOf("]]", i + 2);
      if (j < 0) {
        out.push(code.slice(i));
        break;
      }
      out.push(code.slice(i, j + 2));
      i = j + 2;
      continue;
    }
    if (isNameStart(ch)) {
      const start = i;
      while (i < code.length && isNameChar(code[i])) {
        i = i + 1;
      }
      const word = code.slice(start, i);
      const prev = start > 0 ? code[start - 1] : "";
      if (word === "print" && prev !== "." && prev !== ":") {
        out.push("_np");
      } else {
        out.push(word);
      }
      continue;
    }
    out.push(ch);
    i = i + 1;
  }
  return out.join("");
}

function isNameChar(ch) {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || (ch >= "0" && ch <= "9") || ch === "_";
}

function isNameStart(ch) {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function luaDqEsc(s) {
  let o = '"';
  for (let i = 0; i < s.length; i++) o += "\\" + s.charCodeAt(i);
  return o + '"';
}

function flattenLua(src) {
  return src.replace(/\r\n?/g, "\n").split("\n").map(function (s) {
    return s.replace(/^\s+/, "").replace(/\s+$/, "");
  }).filter(function (s) {
    return s.length > 0;
  }).join(";").replace(/;{2,}/g, ";");
}

function generateProxifiedCode(sourceCode) {
  const valueNames = ["_v1", "_v2", "_v3", "_v4", "_v5", "_v6", "_v7", "_v8"];
  const setMetaName = "_sm";
  const emptyFnName = "_ef";
  
  let proxifiedHeader = `local ${emptyFnName} = function() end\n`;
  proxifiedHeader += `local ${setMetaName} = setmetatable\n`;
  
  let transformed = sourceCode;
  const localMatch = transformed.match(/local\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/g);
  if (localMatch) {
    for (const match of localMatch) {
      const parts = match.match(/local\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/);
      if (parts) {
        const varName = parts[1];
        const varExpr = parts[2];
        const valName = valueNames[Math.floor(Math.random() * valueNames.length)];
        const proxyObj = `${setMetaName}({${valName} = ${varExpr}}, {__index = function(s, k) if k == "${valName}" then return rawget(s, "${valName}") end end, __newindex = function(s, k, v) if k == "${valName}" then s["${valName}"] = v end end})`;
        transformed = transformed.replace(match, `local ${varName} = ${proxyObj}`);
      }
    }
  }
  return proxifiedHeader + transformed;
}

const LUAU_RUNTIME = [
  'local _bfC = ""',
  'local _k12 = ""',
  'local _mn = 0',
  'local _tv = 0',
  'if type(os) == "table" and os.time then _tv = os.time() end',
  '_mn = math.floor(_tv / 60)',
  'local _B91C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" .. string.char(39)',
  'local _B91M = {}',
  'for _i = 1, #_B91C do',
  ' _B91M[string.sub(_B91C, _i, _i)] = _i - 1',
  'end',
  'local function _B91D(s)',
  ' local _v = -1',
  ' local _b = 0',
  ' local _n = 0',
  ' local _o = {}',
  ' for _i = 1, #s do',
  ' local _p = _B91M[string.sub(s, _i, _i)]',
  ' if _p then',
  ' if _v < 0 then',
  ' _v = _p',
  ' else',
  ' _v = _v + _p * 91',
  ' _b = _b + _v * (2 ^ _n)',
  ' if (_v % 8192) > 88 then',
  ' _n = _n + 13',
  ' else',
  ' _n = _n + 14',
  ' end',
  ' while _n >= 8 do',
  ' table.insert(_o, string.char(_b % 256))',
  ' _b = math.floor(_b / 256)',
  ' _n = _n - 8',
  ' end',
  ' _v = -1',
  ' end',
  ' end',
  ' end',
  ' if _v >= 0 then',
  ' table.insert(_o, string.char((_b + _v * (2 ^ _n)) % 256))',
  ' if _n > 7 then',
  ' table.insert(_o, string.char(math.floor((_b + _v * (2 ^ _n)) / 256) % 256))',
  ' end',
  ' end',
  ' return table.concat(_o)',
  'end',
  'local function _R47(s)',
  ' local _t = {}',
  ' local _i = 1',
  ' while true do',
  ' local _b = string.byte(s, _i)',
  ' if not _b then break end',
  ' if _b >= 33 and _b <= 126 then',
  ' _b = 33 + ((_b - 33 + 47) % 94)',
  ' end',
  ' table.insert(_t, string.char(_b))',
  ' _i = _i + 1',
  ' end',
  ' return table.concat(_t)',
  'end',
  'local function _bxor(a, b)',
  ' local r = 0',
  ' local p = 1',
  ' for _i = 1, 8 do',
  ' local x = a % 2',
  ' local y = b % 2',
  ' if x ~= y then',
  ' r = r + p',
  ' end',
  ' a = math.floor(a / 2)',
  ' b = math.floor(b / 2)',
  ' p = p * 2',
  ' end',
  ' return r',
  'end',
  'local function _kxor(data, key)',
  ' local res = {}',
  ' local _i = 1',
  ' while true do',
  ' local b = string.byte(data, _i)',
  ' if not b then break end',
  ' local k = string.byte(key, ((_i - 1) % #key) + 1)',
  ' table.insert(res, string.char(_bxor(b, k)))',
  ' _i = _i + 1',
  ' end',
  ' return table.concat(res)',
  'end',
  'local function _lol(s)',
  ' local o = s:gsub(".", function(_c) return _R47(_c) end)',
  ' return o',
  'end',
  'local function _lolm(s)',
  ' local b = _lol(s)',
  ' return _kxor(b, "z" .. _mn)',
  'end',
  'local function _bfKey()',
  ' local k = {}',
  ' for _i = 1, 12 do',
  ' local _want = string.sub(_bfC, _i, _i)',
  ' for _c = 97, 122 do',
  ' if string.char(_c) == _want then',
  ' k[_i] = string.char(_c)',
  ' break',
  ' end',
  ' end',
  ' if not k[_i] then return nil end',
  ' end',
  ' return table.concat(k)',
  'end',
  'local function _XOR(data, key)',
  ' local decoded = _R47(_B91D(data))',
  ' local res = {}',
  ' for i = 1, #decoded do',
  ' local b = string.byte(decoded, i)',
  ' local k = string.byte(key, ((i - 1) % #key) + 1)',
  ' table.insert(res, string.char(_bxor(b, k)))',
  ' end',
  ' return table.concat(res)',
  'end',
  'local _np = function(...)',
  ' local _f = print',
  ' local _a = {...}',
  ' return _f(table.unpack(_a))',
  'end'
].join(String.fromCharCode(10));

function obfuscate(code) {
  let cleaned = removeComments(code);
  cleaned = generateProxifiedCode(cleaned);
  cleaned += "\n" + makeJunkDoBlocks();
  const printed = replacePrint(cleaned);
  
  const key12 = generateAlphaKey(12);
  const r47Encoded = rot47(base91Encode(printed));
  const outerB = base91Encode(rot47(xorEncrypt(printed, key12)));
  
  let hb = "code in protection by lord-luau.vercel.app\31" + outerB;
  let hash = 0;
  for (let k = 0; k < hb.length; k++) hash = (hash * 31 + hb.charCodeAt(k)) % 9973;
  const seedX = xorEncrypt(generateAlphaKey(10), String(hash));
  
  const header = `(([([[\ncode in protection by lord-luau.vercel.app v1.0\n]]):gsub(".+", function()\n`;
  const footer = `\nend))()`;

  return flattenLua(header + LUAU_RUNTIME + "\n" + printed + footer);
}

function collapseLua(src) {
  return flattenLua(src);
}

const inputCode = document.getElementById("inputCode");
const outputCode = document.getElementById("outputCode");
const protectBtn = document.getElementById("protectBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

function protect() {
  const raw = inputCode.value.trim();
  if (!raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const loadstringCode = `loadstring(game:HttpGet("${raw}"))()`;
      outputCode.textContent = collapseLua(obfuscate(loadstringCode));
      return;
    }
    outputCode.textContent = "Paste Luau code or URL first.";
    return;
  }
  
  let targetCode = raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    targetCode = `loadstring(game:HttpGet("${raw}"))()`;
  }
  
  const result = collapseLua(obfuscate(targetCode));
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

if (protectBtn) protectBtn.addEventListener("click", protect);
if (clearBtn) clearBtn.addEventListener("click", clearAll);
if (copyBtn) copyBtn.addEventListener("click", copyOutput);
