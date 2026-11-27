const B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" + String.fromCharCode(39);
const B91_MAP = {};
for (let _i = 0; _i < B91_CHARS.length; _i++) {
    B91_MAP[B91_CHARS[_i]] = _i;
}
function base91Encode(data) {
    const bytes = [];
    for (let _bi = 0; _bi < data.length; _bi++) {
        bytes.push(data.charCodeAt(_bi) & 255);
    }
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
    let _dec = "";
    for (let _di = 0; _di < out.length; _di++) {
        _dec += String.fromCharCode(out[_di] & 255);
    }
    return _dec;
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
        } else if (ch === "." && code[i + 1] === ".") {
            out.push("..");
            i = i + 2;
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
function encodeStrings(code) {
    let out = "";
    let i = 0;
    const q = String.fromCharCode(34);
    while (i < code.length) {
        if (code[i] === String.fromCharCode(34) || code[i] === String.fromCharCode(39)) {
            const quote = code[i];
            let j = i + 1;
            let inner = "";
            while (j < code.length && code[j] !== quote) {
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
            const r47 = rot47(xored);
            const b91 = base91Encode(r47);
            out = out + "_XOR(" + q + b91 + q + "," + q + key + q + ")";
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
function makeJunkRot91() {
    const raw = makePadString(12 + Math.floor(Math.random() * 20));
    return base91Encode(rot47(raw));
}
function makeJunkDoBlocks() {
    const count = 2 + Math.floor(Math.random() * 2);
    let out = "";
    for (let k = 0; k < count; k++) {
        const j1 = makeJunkRot91();
        const j2 = makeJunkRot91();
        out = out + "do local _j" + k + " = _R47(_B91D(\"" + j1 + "\")) local _k" + k + " = _R47(_B91D(\"" + j2 + "\")) _j" + k + " = _j" + k + " .. _k" + k + " end" + String.fromCharCode(10);
    }
    return out;
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
            if (after.startsWith("local ") || /^[A-Za-z][A-Za-z0-9]\s*\(/.test(after)) {
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
function randomOpcodes() {
    const mnems = ["halt", "pushs", "pushn", "pushnil", "pushtrue", "pushfalse", "load", "store", "add", "sub", "mul", "div", "concat", "eq", "ne", "lt", "gt", "le", "ge", "neg", "call", "jmp", "jz", "forinit", "forloop", "nop"];
    const used = {};
    const map = {};
    for (const m of mnems) {
        let v;
        do {
            v = 11 + Math.floor(Math.random() * 40);
        } while (v in used);
        used[v] = true;
        map[m] = v;
    }
    return map;
}
function dxEncrypt(plain, seed, idx) {
    let x = "";
    for (let i = 0; i < plain.length; i++) {
        const b = plain.charCodeAt(i);
        const k = seed.charCodeAt((i + idx * 13) % seed.length);
        x += String.fromCharCode(b ^ k);
    }
    return rot47(x);
}
function xorStr(s, key) {
    let o = "";
    for (let i = 0; i < s.length; i++) {
        o += String.fromCharCode(s.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return o;
}
function encryptCall(inner) {
    const key = generateRandomKey();
    const r47 = rot47(xorEncrypt(inner, key));
    const b91 = base91Encode(r47);
    return '_XOR("' + b91 + '","' + key + '")';
}
const VM_MARK = "code in protection by lord-luau.vercel.app";
function generateAlphaKey(n) {
    const az = "abcdefghijklmnopqrstuvwxyz";
    let s = "";
    for (let i = 0; i < n; i++) s += az.charAt(Math.floor(Math.random() * 26));
    return s;
}
function bfChecksum(key) {
    return key;
}
function luaDqEsc(s) {
    let o = '"';
    for (let i = 0; i < s.length; i++) o += "\\" + s.charCodeAt(i);
    return o + '"';
}
function flattenLua(src) {
    return src.replace(/\r\n?/g, "\n").split("\n").map(function (s) {
        return s.replace(/^\s+/, "").replace(/\s+$/, "");
    }).filter(function (s) { return s.length > 0; }).join(";").replace(/;{2,}/g, ";");
}
function tokenizeLua(src) {
    const toks = [];
    let i = 0;
    const n = src.length;
    const isNameStart = function (c) { return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_"; };
    const isNameChar = function (c) { return isNameStart(c) || (c >= "0" && c <= "9"); };
    while (i < n) {
        const c = src[i];
        if (c === " " || c === "\n" || c === "\r" || c === "\t" || c === ";") {
            i++;
            continue;
        }
        if (isNameStart(c)) {
            let j = i;
            while (j < n && isNameChar(src[j])) j++;
            toks.push({ t: "name", v: src.slice(i, j) });
            i = j;
            continue;
        }
        if (c >= "0" && c <= "9") {
            let j = i;
            while (j < n && (src[j] >= "0" && src[j] <= "9" || src[j] === ".")) j++;
            toks.push({ t: "num", v: src.slice(i, j) });
            i = j;
            continue;
        }
        if (c === '"' || c === "'") {
            const q = c;
            let j = i + 1;
            let inner = "";
            while (j < n && src[j] !== q) {
                if (src[j] === "\\" && j + 1 < n) {
                    inner += src[j] + src[j + 1];
                    j += 2;
                } else {
                    inner += src[j];
                    j++;
                }
            }
            if (j >= n) throw new Error("unterminated string");
            toks.push({ t: "str", v: inner });
            i = j + 1;
            continue;
        }
        const two = src.slice(i, i + 2);
        if (two === "==" || two === "~=" || two === "<=" || two === ">=" || two === "..") {
            toks.push({ t: "op", v: two });
            i += 2;
            continue;
        }
        if ("+-*/%^(){}<>=,;".indexOf(c) >= 0) {
            toks.push({ t: "op", v: c });
            i++;
            continue;
        }
        throw new Error("unsupported character " + c);
    }
    toks.push({ t: "eof" });
    return toks;
}
function compileVM(source) {
    const toks = tokenizeLua(source);
    let p = 0;
    const bc = [];
    const consts = [];
    const slots = {};
    let slotCount = 0;
    const op = randomOpcodes();
    const seed = makePadString(10);
    function push() {
        const pc = bc.length + 1;
        for (let k = 0; k < arguments.length; k++) bc.push(arguments[k]);
        return pc;
    }
    function patch(operandPc, targetPc) {
        bc[operandPc - 1] = targetPc;
    }
    function constStr(s) {
        consts.push({ kind: "s", blob: dxEncrypt(s, seed, consts.length + 1) });
        return consts.length;
    }
    function constNum(s) {
        consts.push({ kind: "n", blob: dxEncrypt(s, seed, consts.length + 1) });
        return consts.length;
    }
    function slotOf(name) {
        if (!(name in slots)) slots[name] = ++slotCount;
        return slots[name];
    }
    function kw(k) {
        const t = toks[p];
        return t.t === "name" && t.v === k;
    }
    function opv(v) {
        const t = toks[p];
        return t.t === "op" && t.v === v;
    }
    function eatKw(k) {
        if (kw(k)) { p++; return true; }
        return false;
    }
    function eatOp(v) {
        if (opv(v)) { p++; return true; }
        return false;
    }
    function expectOp(v) {
        if (!eatOp(v)) throw new Error("expected " + v);
    }
    function parseExpr() { parseOr(); }
    function parseOr() {
        parseAnd();
        while (kw("or")) {
            p++;
            const jz = push(op.jz, 0);
            parseAnd();
            const jm = push(op.jmp, 0);
            patch(jz + 1, jz + 2);
            patch(jm + 1, bc.length + 1);
        }
    }
    function parseAnd() {
        parseCmp();
        while (kw("and")) {
            p++;
            const jz = push(op.jz, 0);
            parseCmp();
            patch(jz + 1, bc.length + 1);
        }
    }
    function parseCmp() {
        parseConcat();
        while (opv("==") || opv("~=") || opv("<") || opv(">") || opv("<=") || opv(">=")) {
            const o = toks[p].v;
            p++;
            parseConcat();
            if (o === "==") push(op.eq);
            else if (o === "~=") push(op.ne);
            else if (o === "<") push(op.lt);
            else if (o === ">") push(op.gt);
            else if (o === "<=") push(op.le);
            else push(op.ge);
        }
    }
    function parseConcat() {
        parseAdd();
        if (opv("..")) {
            p++;
            parseConcat();
            push(op.concat);
        }
    }
    function parseAdd() {
        parseMul();
        while (opv("+") || opv("-")) {
            const o = toks[p].v;
            p++;
            parseMul();
            push(o === "+" ? op.add : op.sub);
        }
    }
    function parseMul() {
        parseUnary();
        while (opv("*") || opv("/") || opv("%")) {
            const o = toks[p].v;
            p++;
            parseUnary();
            push(o === "*" ? op.mul : op.div);
        }
    }
    function parseUnary() {
        if (opv("-")) {
            p++;
            parseUnary();
            push(op.neg);
            return;
        }
        if (kw("not")) {
            p++;
            parseUnary();
            push(op.ne);
            return;
        }
        parsePrimary();
    }
    function parseArgs() {
        let n = 0;
        if (!opv(")")) {
            n++;
            parseExpr();
            while (eatOp(",")) {
                n++;
                parseExpr();
            }
        }
        return n;
    }
    function parsePrimary() {
        const t = toks[p];
        if (t.t === "num") {
            p++;
            push(op.pushn, constNum(t.v));
            return;
        }
        if (t.t === "str") {
            p++;
            push(op.pushs, constStr(t.v));
            return;
        }
        if (t.t === "name" && t.v === "true") { p++; push(op.pushtrue); return; }
        if (t.t === "name" && t.v === "false") { p++; push(op.pushfalse); return; }
        if (t.t === "name" && t.v === "nil") { p++; push(op.pushnil); return; }
        if (t.t === "name" && opv("(")) {
            if (t.v !== "_np") throw new Error("unsupported call " + t.v);
            p++;
            p++;
            const n = parseArgs();
            expectOp(")");
            push(op.call, n);
            return;
        }
        if (t.t === "name") {
            if (!(t.v in slots)) throw new Error("unknown name " + t.v);
            p++;
            push(op.load, slots[t.v]);
            return;
        }
        if (eatOp("(")) {
            parseExpr();
            expectOp(")");
            return;
        }
        throw new Error("unsupported expression");
    }
    function parseStat() {
        if (eatKw("local")) {
            const name = toks[p];
            if (name.t !== "name") throw new Error("local name expected");
            p++;
            const s = slotOf(name.v);
            if (eatOp("=")) parseExpr();
            else push(op.pushnil);
            push(op.store, s);
            return;
        }
        if (eatKw("if")) {
            parseExpr();
            if (!eatKw("then")) throw new Error("if then expected");
            let jz = push(op.jz, 0);
            parseBlock(["elseif", "else", "end"]);
            const jmps = [];
            while (eatKw("elseif")) {
                jmps.push(push(op.jmp, 0));
                patch(jz + 1, bc.length + 1);
                parseExpr();
                jz = push(op.jz, 0);
                parseBlock(["elseif", "else", "end"]);
            }
            if (eatKw("else")) {
                jmps.push(push(op.jmp, 0));
                patch(jz + 1, bc.length + 1);
                parseBlock(["end"]);
            } else {
                patch(jz + 1, bc.length + 1);
            }
            for (let k = 0; k < jmps.length; k++) patch(jmps[k] + 1, bc.length + 1);
            if (!eatKw("end")) throw new Error("if end expected");
            return;
        }
        if (eatKw("while")) {
            const start = bc.length + 1;
            parseExpr();
            if (!eatKw("do")) throw new Error("while do expected");
            const jz = push(op.jz, 0);
            parseBlock(["end"]);
            if (!eatKw("end")) throw new Error("while end expected");
            push(op.jmp, start);
            patch(jz + 1, bc.length + 1);
            return;
        }
        if (eatKw("for")) {
            const name = toks[p];
            if (name.t !== "name") throw new Error("for name expected");
            p++;
            expectOp("=");
            parseExpr();
            expectOp(",");
            parseExpr();
            if (eatOp(",")) parseExpr();
            else push(op.pushn, constNum("1"));
            const vs = slotOf(name.v);
            const ls = slotOf(name.v + "__lim");
            const ss = slotOf(name.v + "__step");
            push(op.forinit, vs, ls, ss);
            if (!eatKw("do")) throw new Error("for do expected");
            const bodyStart = bc.length + 1;
            parseBlock(["end"]);
            if (!eatKw("end")) throw new Error("for end expected");
            const fl = push(op.forloop, vs, ls, ss, 0, bodyStart);
            patch(fl + 4, bc.length + 1);
            return;
        }
        if (eatKw("do")) {
            parseBlock(["end"]);
            if (!eatKw("end")) throw new Error("do end expected");
            return;
        }
        if (eatKw("return")) {
            if (toks[p].t !== "eof" && !(toks[p].t === "name" && ["end", "else", "elseif"].indexOf(toks[p].v) >= 0)) parseExpr();
            push(op.halt);
            return;
        }
        if (toks[p].t === "name" && toks[p + 1] && toks[p + 1].t === "op" && toks[p + 1].v === "=") {
            const name = toks[p].v;
            p++;
            expectOp("=");
            parseExpr();
            push(op.store, slotOf(name));
            return;
        }
        if (toks[p].t === "name" && toks[p + 1] && toks[p + 1].t === "op" && toks[p + 1].v === "(") {
            if (toks[p].v !== "_np") throw new Error("unsupported call");
            p++;
            p++;
            const n = parseArgs();
            expectOp(")");
            push(op.call, n);
            return;
        }
        throw new Error("unsupported statement near " + JSON.stringify(toks[p]));
    }
    function injectNoise() {
        push(op.pushnil);
        const jzPc = push(op.jz, 0);
        const jmpPc = push(op.jmp, 0);
        const label = bc.length + 1;
        push(op.nop);
        patch(jzPc + 1, label);
        patch(jmpPc + 1, bc.length + 1);
    }
    function parseBlock(stops) {
        while (true) {
            const t = toks[p];
            if (t.t === "eof") break;
            if (t.t === "name" && stops.indexOf(t.v) >= 0) break;
            parseStat();
        }
    }
    parseBlock([]);
    injectNoise();
    injectNoise();
    push(op.halt);
    const bPlain = bc.join(",");
    const oPlain = Object.keys(op).map(function (k) { return k + "=" + op[k]; }).join(",");
    const bBlob = dxEncrypt(bPlain, seed, 99);
    const oBlob = dxEncrypt(oPlain, seed, 7);
    const cBlobs = consts.map(function (ct) { return ct.blob; });
    const key12 = generateAlphaKey(12);
    const bfC = bfChecksum(key12);
    const sep = String.fromCharCode(255);
    const innerPack = oBlob + sep + bBlob + sep + cBlobs.join(sep);
    const vmSingle = base91Encode(rot47(xorStr(innerPack, key12)));
    const junk1 = base91Encode(rot47(makePadString(16)));
    const junk2 = base91Encode(rot47(makePadString(16)));
    const t0 = Math.floor(Date.now() / 60000);
    const hb = VM_MARK + String.fromCharCode(31) + vmSingle;
    let hash = 0;
    for (let k = 0; k < hb.length; k++) hash = (hash * 31 + hb.charCodeAt(k)) % 9973;
    const seedX = xorStr(seed, String(hash));
    return {
        bc: bc,
        consts: consts,
        opmap: op,
        seed: seed,
        seedX: seedX,
        bBlob: bBlob,
        oBlob: oBlob,
        cBlobs: cBlobs,
        bfC: bfC,
        key12: key12,
        vmSingle: vmSingle,
        junk1: junk1,
        junk2: junk2,
        hash: hash,
        t0: t0
    };
}
function emitVM(c) {
    const nl = String.fromCharCode(10);
    const lines = [];
    lines.push('local vm = "' + c.vmSingle + '"');
    lines.push('local _junk1 = _R47(_B91D("' + c.junk1 + '"))');
    lines.push('local _junk2 = _R47(_B91D("' + c.junk2 + '"))');
    lines.push('local _junk = _junk1 .. _junk2');
    lines.push('local _M0=[[' + VM_MARK + ']]');
    lines.push('_bfC = ' + luaDqEsc(rot47(c.key12)));
    lines.push('local _seedX = ' + luaDqEsc(c.seedX));
    lines.push('local _t0 = ' + c.t0);
    lines.push('local _hb = _M0 .. "\\31" .. vm');
    lines.push('local _h = 0');
    lines.push('local _hi = 1');
    lines.push('while true do local _hbB = string.byte(_hb, _hi); if not _hbB then break end; _h = (_h * 31 + _hbB) % 9973; _hi = _hi + 1 end');
    lines.push('local _seedBase = _kxor(_seedX, tostring(_h))');
    lines.push('local _seed = _seedBase');
    lines.push('if _waitFn then local _co2 = coroutine.create(function() while true do _waitFn(60) if type(os) == "table" and os.time then _mn = math.floor(os.time() / 60) end _seed = _kxor(_seedX, tostring(_h + _mn)) _k12 = _bfKey() end end) coroutine.resume(_co2) end');
    lines.push('if _M0 ~= [[' + VM_MARK + ']] then _np(_lolm(vm)) end');
    lines.push('_k12 = _bfKey()');
    lines.push('if _k12 then');
    lines.push('local _ov = _kxor(_R47(_B91D(vm)), _k12)');
    lines.push('local _parts = {}');
    lines.push('for _seg in string.gmatch(_ov, "[^\\255]+") do _parts[#_parts + 1] = _seg end');
    lines.push('if #_parts < 3 then');
    lines.push('_np(_lolm(vm))');
    lines.push('else');
    lines.push('local _oRaw = _DX(_parts[1], _seedBase, 7)');
    lines.push('local _OP = {}');
    lines.push('for _pair in string.gmatch(_oRaw, "[^,]+") do');
    lines.push('local _k, _v = string.match(_pair, "(%w+)=([0-9]+)")');
    lines.push('if _k then _OP[_k] = tonumber(_v) end');
    lines.push('end');
    lines.push('local _bRaw = _DX(_parts[2], _seedBase, 99)');
    lines.push('local _B = {}');
    lines.push('for _tok in string.gmatch(_bRaw, "[^,]+") do _B[#_B + 1] = tonumber(_tok) end');
    lines.push('local _C = {}');
    lines.push('for _i = 3, #_parts do _C[_i - 2] = _DX(_parts[_i], _seedBase, _i - 2) end');
    lines.push('if _OP.halt == nil or _B[1] == nil then');
    lines.push('_np(_lolm(vm))');
    lines.push('else');
    lines.push('local _E = { np = _np }');
    lines.push('local _ST = {}');
    lines.push('local _SL = {}');
    lines.push('local function _run(_pc)');
    lines.push('while true do');
    lines.push('local _o = _B[_pc]');
    lines.push('if _o == _OP.halt then break end');
    lines.push('if _o == _OP.pushs then _ST[#_ST + 1] = _C[_B[_pc + 1]]; _pc = _pc + 2');
    lines.push('elseif _o == _OP.pushn then _ST[#_ST + 1] = tonumber(_C[_B[_pc + 1]]); _pc = _pc + 2');
    lines.push('elseif _o == _OP.pushnil then _ST[#_ST + 1] = nil; _pc = _pc + 1');
    lines.push('elseif _o == _OP.pushtrue then _ST[#_ST + 1] = true; _pc = _pc + 1');
    lines.push('elseif _o == _OP.pushfalse then _ST[#_ST + 1] = false; _pc = _pc + 1');
    lines.push('elseif _o == _OP.load then _ST[#_ST + 1] = _SL[_B[_pc + 1]]; _pc = _pc + 2');
    lines.push('elseif _o == _OP.store then _SL[_B[_pc + 1]] = _ST[#_ST]; _ST[#_ST] = nil; _pc = _pc + 2');
    lines.push('elseif _o == _OP.add then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a + _b; _pc = _pc + 1');
    lines.push('elseif _o == _OP.sub then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a - _b; _pc = _pc + 1');
    lines.push('elseif _o == _OP.mul then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a * _b; _pc = _pc + 1');
    lines.push('elseif _o == _OP.div then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a / _b; _pc = _pc + 1');
    lines.push('elseif _o == _OP.concat then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a .. _b; _pc = _pc + 1');
    lines.push('elseif _o == _OP.eq then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a == _b); _pc = _pc + 1');
    lines.push('elseif _o == _OP.ne then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a ~= _b); _pc = _pc + 1');
    lines.push('elseif _o == _OP.lt then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a < _b); _pc = _pc + 1');
    lines.push('elseif _o == _OP.gt then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a > _b); _pc = _pc + 1');
    lines.push('elseif _o == _OP.le then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a <= _b); _pc = _pc + 1');
    lines.push('elseif _o == _OP.ge then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a >= _b); _pc = _pc + 1');
    lines.push('elseif _o == _OP.neg then local _a = table.remove(_ST); _ST[#_ST + 1] = -_a; _pc = _pc + 1');
    lines.push('elseif _o == _OP.call then local _n = _B[_pc + 1]; local _a = {}; for _k = _n, 1, -1 do _a[_k] = table.remove(_ST) end; _E.np(_unpack(_a)); _pc = _pc + 2');
    lines.push('elseif _o == _OP.jmp then _pc = _B[_pc + 1]');
    lines.push('elseif _o == _OP.jz then local _v = table.remove(_ST); if not _v then _pc = _B[_pc + 1] else _pc = _pc + 2 end');
    lines.push('elseif _o == _OP.forinit then local _st = table.remove(_ST); local _lm = table.remove(_ST); local _sv = table.remove(_ST); _SL[_B[_pc + 1]] = _sv; _SL[_B[_pc + 2]] = _lm; _SL[_B[_pc + 3]] = _st; _pc = _pc + 4');
    lines.push('elseif _o == _OP.forloop then local _v = _SL[_B[_pc + 1]] + _SL[_B[_pc + 3]]; _SL[_B[_pc + 1]] = _v; local _lm = _SL[_B[_pc + 2]]; local _st = _SL[_B[_pc + 3]]; local _exit = _B[_pc + 4]; local _body = _B[_pc + 5]; if _st >= 0 then if _v > _lm then _pc = _exit else _pc = _body end else if _v < _lm then _pc = _exit else _pc = _body end end');
    lines.push('elseif _o == _OP.nop then _pc = _pc + 1');
    lines.push('else break end');
    lines.push('end');
    lines.push('end');
    lines.push('_run(1)');
    lines.push('end');
    lines.push('end');
    lines.push('else');
    lines.push('_np(_lolm(vm))');
    lines.push('end');
    return flattenLua('([[code in protection by lord-protect]]):gsub(".+",function()' + nl + LUAU_RUNTIME + nl + lines.join(nl) + nl + 'end)');
}
const LUAU_RUNTIME = [
'local _bfC = ""',
'local _k12 = ""',
'local _mn = 0',
'local _tv = 0',
'if type(os) == "table" and os.time then _tv = os.time() end',
'_mn = math.floor(_tv / 60)',
'local _unpack = table.unpack or unpack',
'local _isStudio = false',
'if type(game) ~= "nil" then if type(game) == "userdata" then _isStudio = true end end',
'local _waitFn = nil',
'if type(task) == "table" and task.wait then _waitFn = task.wait elseif type(wait) == "function" then _waitFn = wait end',
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
'        if _n > 7 then',
'            table.insert(_o, string.char(math.floor((_b + _v * (2 ^ _n)) / 256) % 256))',
'        end',
'    end',
'    return table.concat(_o)',
'end',
'local function _R47(s)',
'    local _t = {}',
'    local _i = 1',
'    while true do',
'        local _b = string.byte(s, _i)',
'        if not _b then break end',
'        if _b >= 33 and _b <= 126 then',
'            _b = 33 + ((_b - 33 + 47) % 94)',
'        end',
'        table.insert(_t, string.char(_b))',
'        _i = _i + 1',
'    end',
'    return table.concat(_t)',
'end',
'local function _bxor(a, b)',
'    local r = 0',
'    local p = 1',
'    for _i = 1, 8 do',
'        local x = a % 2',
'        local y = b % 2',
'        if x ~= y then',
'            r = r + p',
'        end',
'        a = math.floor(a / 2)',
'        b = math.floor(b / 2)',
'        p = p * 2',
'    end',
'    return r',
'end',
'local function _kxor(data, key)',
'    local res = {}',
'    local _i = 1',
'    while true do',
'        local b = string.byte(data, _i)',
'        if not b then break end',
'        local k = string.byte(key, ((_i - 1) % #key) + 1)',
'        table.insert(res, string.char(_bxor(b, k)))',
'        _i = _i + 1',
'    end',
'    return table.concat(res)',
'end',
'local function _DX(data, seed, idx)',
'    local decoded = _R47(data)',
'    local res = {}',
'    local _i = 1',
'    while true do',
'        local b = string.byte(decoded, _i)',
'        if not b then break end',
'        local k = string.byte(seed, ((_i - 1 + idx * 13) % #seed) + 1)',
'        table.insert(res, string.char(_bxor(b, k)))',
'        _i = _i + 1',
'    end',
'    return table.concat(res)',
'end',
'local function _lol(s)',
'    local o = s:gsub(".", function(_c) return _R47(_c) end)',
'    return o',
'end',
'local function _lolm(s)',
'    local b = _lol(s)',
'    return _kxor(b, "z" .. _mn)',
'end',
'local function _bfKey()',
'    local k = {}',
'    for _i = 1, 12 do',
'        local _want = string.sub(_bfC, _i, _i)',
'        for _c = 97, 122 do',
'            if _R47(string.char(_c)) == _want then',
'                k[_i] = string.char(_c)',
'                break',
'            end',
'        end',
'        if not k[_i] then return nil end',
'    end',
'    return table.concat(k)',
'end',
'if _waitFn then',
'    local _co = coroutine.create(function()',
'        while true do',
'            _waitFn(60)',
'            if type(os) == "table" and os.time then _mn = math.floor(os.time() / 60) end',
'        end',
'    end)',
'    coroutine.resume(_co)',
'end',
'local function _XOR(data, key)',
'    local decoded = _R47(_B91D(data))',
'    local res = {}',
'    for i = 1, #decoded do',
'        local b = string.byte(decoded, i)',
'        local k = string.byte(key, ((i - 1) % #key) + 1)',
'        table.insert(res, string.char(_bxor(b, k)))',
'    end',
'    return table.concat(res)',
'end',
'local _np = function(...)',
'    local _f = print',
'    local _a = {...}',
'    return _f(_unpack(_a))',
'end'
].join(String.fromCharCode(10));
function obfuscate(code) {
    const cleaned = removeComments(code);
    const printed = replacePrint(cleaned);
    let compiled = null;
    try {
        compiled = compileVM(printed);
    } catch (err) {
        compiled = null;
    }
    if (compiled && compiled.bc.length > 2) {
        return emitVM(compiled);
    }
    const renamed = renameVars(printed);
    const padded = renamed + String.fromCharCode(10) + makeJunkDoBlocks();
    const encoded = encodeStrings(padded);
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
    const wrapped = "do" + String.fromCharCode(10) + flat + String.fromCharCode(10) + "end";
    const legacy = 'local _M0=[[' + VM_MARK + ']]' + String.fromCharCode(10) + LUAU_RUNTIME + String.fromCharCode(10) + String.fromCharCode(10) + wrapped;
    return flattenLua(legacy);
}
function collapseLua(src) {
    return flattenLua(src);
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
    const result = collapseLua(obfuscate(raw));
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
