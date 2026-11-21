const B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()+,./:;<=>?@[]^_-{|}~" + String.fromCharCode(39);
const B91_MAP = {};
for (let _i = 0; _i < B91_CHARS.length; _i++) {
    B91_MAP[B91_CHARS[_i]] = _i;
}
function base91Encode(data) {
    let b = 0, n = 0, out = "";
    for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        b = b | (byte << n);
        n += 8;
        if (n > 13) {
            const v = b & 8191;
            if (v > 88) {
                out += B91_CHARS[v % 91];
                out += B91_CHARS[Math.floor(v / 91)];
                b = b >> 13;
                n -= 13;
            } else {
                out += B91_CHARS[v % 91];
                out += B91_CHARS[Math.floor(v / 91)];
                b = b >> 14;
                n -= 14;
            }
        }
    }
    if (n > 0) {
        out += B91_CHARS[b % 91];
        if (n > 7 || b > 90) {
            out += B91_CHARS[Math.floor(b / 91)];
        }
    }
    return out;
}
function base91Decode(text) {
    let v = -1, b = 0, n = 0, out = [];
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (!(ch in B91_MAP)) continue;
        const p = B91_MAP[ch];
        if (v < 0) v = p;
        else {
            v += p * 91;
            b |= (v << n);
            if ((v & 8191) > 88) n += 13;
            else n += 14;
            while (n >= 8) {
                out.push(b & 255);
                b >>= 8;
                n -= 8;
            }
            v = -1;
        }
    }
    if (v >= 0) out.push((b | (v << n)) & 255);
    return new Uint8Array(out);
}
function toBytes(s) {
    return new TextEncoder().encode(s);
}
function fromBytes(b) {
    return new TextDecoder().decode(b);
}
function rot47Encode(s) {
    let r = "";
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c >= 33 && c <= 126) {
            r += String.fromCharCode(33 + ((c + 14) % 94));
        } else r += s[i];
    }
    return r;
}
function rot47Decode(s) {
    let r = "";
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c >= 33 && c <= 126) {
            r += String.fromCharCode(33 + ((c - 14 + 94) % 94));
        } else r += s[i];
    }
    return r;
}
function xorEncrypt(text, key) {
    let r = "";
    for (let i = 0; i < text.length; i++) {
        r += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return r;
}
function generateRandomKey(len = 4) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let k = "";
    for (let i = 0; i < len; i++) k += chars[Math.floor(Math.random() * chars.length)];
    return k;
}
function generateAlphaKey(len = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let k = "";
    for (let i = 0; i < len; i++) k += chars[Math.floor(Math.random() * chars.length)];
    return k;
}
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KEYWORDS = ["and", "break", "do", "else", "elseif", "end", "false", "for", "function", "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while", "print"];
function randomThree(used) {
    while (true) {
        let name = "";
        for (let k = 0; k < 3; k++) name += LETTERS[Math.floor(Math.random() * LETTERS.length)];
        if (!(name in used) && KEYWORDS.indexOf(name) < 0) {
            used[name] = true;
            return name;
        }
    }
}
function isNameChar(ch) {
    return /[a-zA-Z0-9_]/.test(ch);
}
function isNameStart(ch) {
    return /[a-zA-Z_]/.test(ch);
}
function removeComments(code) {
    let out = "", i = 0;
    while (i < code.length) {
        if (code[i] === "-" && code[i+1] === "-") {
            if (code[i+2] === "[" && code[i+3] === "[") {
                const j = code.indexOf("]]", i + 4);
                if (j < 0) break;
                i = j + 2;
                out += "\n";
            } else {
                while (i < code.length && code[i] !== "\n") i++;
                out += "\n";
            }
        } else if (code[i] === '"' || code[i] === "'") {
            const q = code[i];
            out += code[i];
            i++;
            while (i < code.length) {
                out += code[i];
                if (code[i] === q && code[i-1] !== "\\") { i++; break; }
                i++;
            }
        } else if (code[i] === "[" && code[i+1] === "[") {
            const j = code.indexOf("]]", i + 2);
            if (j < 0) { out += code.slice(i); break; }
            out += code.slice(i, j + 2);
            i = j + 2;
        } else {
            out += code[i];
            i++;
        }
    }
    return out;
}
function renameVars(code) {
    const map = {}, used = {};
    let out = [], i = 0;
    function copySpaces() {
        while (i < code.length && " \t\n\r".includes(code[i])) {
            out.push(code[i]);
            i++;
        }
    }
    function readName() {
        const s = i;
        while (i < code.length && isNameChar(code[i])) i++;
        return code.slice(s, i);
    }
    function mapName(name) {
        if (!map[name]) map[name] = randomThree(used);
        return map[name];
    }
    while (i < code.length) {
        const ch = code[i];
        if (ch === '"' || ch === "'") {
            const q = ch;
            let j = i + 1;
            while (j < code.length) {
                if (code[j] === q && code[j-1] !== "\\") break;
                j++;
            }
            out.push(code.slice(i, j + 1));
            i = j + 1;
        } else if (ch === "[" && code[i+1] === "[") {
            let j = code.indexOf("]]", i + 2);
            j = j < 0 ? code.length - 1 : j + 1;
            out.push(code.slice(i, j + 1));
            i = j + 1;
        } else if (ch === "." || ch === ":") {
            out.push(ch); i++;
            copySpaces();
            const s = i;
            while (i < code.length && isNameChar(code[i])) i++;
            out.push(code.slice(s, i));
        } else if (isNameStart(ch)) {
            const s = i;
            while (i < code.length && isNameChar(code[i])) i++;
            const word = code.slice(s, i);
            if (word === "local") {
                out.push(word); copySpaces();
                if (code.slice(i, i + 8) === "function" && !isNameChar(code[i + 8] || "")) {
                    out.push("function"); i += 8; copySpaces();
                    const fname = readName();
                    if (fname) out.push(mapName(fname));
                    copySpaces();
                    if (code[i] === "(") {
                        out.push("("); i++;
                        while (i < code.length && code[i] !== ")") {
                            if (isNameStart(code[i])) {
                                const ns = i;
                                while (i < code.length && isNameChar(code[i])) i++;
                                out.push(mapName(code.slice(ns, i)));
                            } else out.push(code[i++]);
                        }
                        out.push(")"); i++;
                    }
                } else {
                    while (true) {
                        const ns = i;
                        while (i < code.length && isNameChar(code[i])) i++;
                        const name = code.slice(ns, i);
                        if (!name) break;
                        out.push(mapName(name)); copySpaces();
                        if (code[i] === ",") { out.push(","); i++; copySpaces(); continue; }
                        break;
                    }
                }
            } else if (word === "function") {
                out.push(word); copySpaces();
                if (code[i] === "(") {
                    out.push("("); i++;
                    while (i < code.length && code[i] !== ")") {
                        if (isNameStart(code[i])) {
                            const ns = i;
                            while (i < code.length && isNameChar(code[i])) i++;
                            out.push(mapName(code.slice(ns, i)));
                        } else out.push(code[i++]);
                    }
                    out.push(")"); i++;
                } else {
                    const fname = readName();
                    if (fname) out.push(map[fname] || fname);
                    while (i < code.length && (code[i] === "." || code[i] === ":")) {
                        out.push(code[i++]); copySpaces(); readName();
                    }
                    copySpaces();
                    if (code[i] === "(") {
                        out.push("("); i++;
                        while (i < code.length && code[i] !== ")") {
                            if (isNameStart(code[i])) {
                                const ns = i;
                                while (i < code.length && isNameChar(code[i])) i++;
                                out.push(mapName(code.slice(ns, i)));
                            } else out.push(code[i++]);
                        }
                        out.push(")"); i++;
                    }
                }
            } else if (word === "for") {
                out.push(word); copySpaces();
                while (true) {
                    const ns = i;
                    while (i < code.length && isNameChar(code[i])) i++;
                    const name = code.slice(ns, i);
                    if (!name) break;
                    out.push(mapName(name)); copySpaces();
                    if (code[i] === ",") { out.push(","); i++; copySpaces(); continue; }
                    if (code.slice(i, i + 2) === "in" && !isNameChar(code[i + 2] || "")) { out.push("in"); i += 2; }
                    break;
                }
            } else if (KEYWORDS.includes(word)) out.push(word);
            else if (map[word]) out.push(map[word]);
            else out.push(word);
        } else {
            out.push(ch);
            i++;
        }
    }
    return out.join("");
}
function encryptString(s) {
    const k = generateRandomKey();
    let e = rot47Encode(s);
    e = xorEncrypt(e, k);
    return `_X("${base91Encode(toBytes(e))}","${k}")`;
}
function encodeStrings(code) {
    return code.replace(/"((?:\\.|[^"])*)"/g, (_, g) => `"${encryptString(g)}"`).replace(/'((?:\\.|[^'])*)'/g, (_, g) => `"${encryptString(g)}"`);
}
function generateJunkBlock(used) {
    const fn1 = randomThree(used), fn2 = randomThree(used), v1 = randomThree(used), v2 = randomThree(used), v3 = randomThree(used), v4 = randomThree(used);
    const n1 = Math.floor(Math.random() * 9000) + 1000;
    const n2 = Math.floor(Math.random() * 9000) + 1000;
    return `local ${fn1}=function()return"${generateRandomKey(8)}"end local ${fn2}=function()return${n1}end local ${v1}=${fn1}()..${fn2}() local ${v2}=(${n1}*${n2}+${Math.floor(Math.random()*999)})%9973 local ${v3}=${v2}*2-${v2} if false then ${v4}=${fn1}() end`;
}
function insertJunk(code, count = 15) {
    const lines = code.split("\n");
    const used = {};
    for (let i = 0; i < count; i++) {
        const junk = generateJunkBlock(used);
        const pos = Math.floor(Math.random() * (lines.length + 1));
        lines.splice(pos, 0, junk);
    }
    return lines.join("\n");
}
function flattenLua(code) {
    return code.replace(/\s+/g, " ").replace(/\s*;\s*/g, ";").trim().replace(/\s+(do|end|then|else|elseif|if|for|while|local|return|function)\s*/g, " $1 ").replace(/\s+/g, " ").trim();
}
const LUA_RUNTIME = `local B91C="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()+,./:;<=>?@[]^_-{|}~"..string.char(39)
local _B91M={}
for _i=1,#B91C do _B91M[string.sub(B91C,_i,_i)]=_i-1 end
local function _B91D(s)
 local _v,_b,_n,_o=-1,0,0,{}
 for _i=1,#s do
  local _p=_B91M[string.sub(s,_i,_i)]
  if _p~=nil then
   if _v<0 then _v=_p else
    _v=_v+_p*91
    _b=_b+_v*(2^_n)
    if (_v%8192)>88 then _n=_n+13 else _n=_n+14 end
    while _n>=8 do table.insert(_o,string.char(_b%256)) _b=math.floor(_b/256) _n=_n-8 end
    _v=-1
   end
  end
 end
 if _v>=0 then table.insert(_o,string.char((_b+_v*(2^_n))%256)) end
 return table.concat(_o)
end
local function _R47(s)
 local r=""
 for i=1,#s do
  local c=string.byte(s,i)
  if c>=33 and c<=126 then c=33+((c-33+14)%94) end
  r=r..string.char(c)
 end
 return r
end
local function _kxor(s,k)
 local r=""
 for i=1,#s do
  local d=string.byte(s,i)
  local x=string.byte(k,((i-1)%#k)+1)
  r=r..string.char(d~x)
 end
 return r
end
local function _X(d,k)return _R47(_kxor(_B91D(d),k))end
local _E={np=function(...)return print(...)end}
local _np=function(...)return _E.np(...)end
local function _lol(s)return s:gsub(".",function(c)local b=c:byte()return b>=33 and b<=126 and string.char(33+((b-33-14+94)%94))or c end)end`;

function obfuscate(code) {
    const HEADER = `local _mo=([[code in protection by lord-luau.vercel.app]]):gsub(".+",function(s)return s end)`;
    let cleaned = removeComments(code);
    cleaned = cleaned.replace(/print\s*\(/g, "_np(");
    cleaned = renameVars(cleaned);
    cleaned = encodeStrings(cleaned);
    cleaned = insertJunk(cleaned, 15);
    
    const outerKey = generateAlphaKey(12);
    const vmContent = rot47Encode(outerKey);
    const vmBlob = base91Encode(toBytes(vmContent));
    
    let hash = 0;
    for (let i = 0; i < vmBlob.length; i++) {
        hash = (hash * 31 + vmBlob.charCodeAt(i)) % 9973;
    }
    
    const vmBlock = `local vm="${vmBlob}" local _h=${hash} local _k12="${vmContent}"`;
    let fullOutput = `${HEADER} ${vmBlock} do local _chk=0 for _i=1,10 do _chk=_chk+_i*7 end if _h~=${hash} then _k12=_lol(_k12) end end ${cleaned}`;
    fullOutput = flattenLua(fullOutput);
    return `${LUA_RUNTIME}\n\n${fullOutput}`;
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

function refreshIcons() { if (window.lucide) lucide.createIcons(); }
function toggleSidebar() { sidebar.classList.toggle("open"); if (sidebarOverlay) sidebarOverlay.classList.toggle("open"); refreshIcons(); }
if (sidebarOverlay) sidebarOverlay.addEventListener("click", toggleSidebar);
function showTab(tabName) {
    navItems.forEach(i => i.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));
    navItems.forEach(i => i.classList.toggle("active", i.dataset.tab === tabName));
    panels.forEach(p => p.classList.toggle
