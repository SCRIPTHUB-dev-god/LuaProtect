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
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KEYWORDS = ["and", "break", "do", "else", "elseif", "end", "false", "for", "function", "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while"];
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
function renameVars(code) {
  const map = {};
  const used = {};
  const out = [];
  let i = 0;
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
        while (i < code.length && code[i] === " ") {
          out.push(code[i]);
          i = i + 1;
        }
        while (true) {
          if (code.slice(i, i + 8) === "function" && (i + 8 >= code.length || !isNameChar(code[i + 8]))) {
            out.push("function");
            i = i + 8;
            while (i < code.length && code[i] === " ") {
              out.push(code[i]);
              i = i + 1;
            }
            const fstart = i;
            while (i < code.length && isNameChar(code[i])) {
              i = i + 1;
            }
            const fname = code.slice(fstart, i);
            if (fname) {
              if (!(fname in map)) {
                map[fname] = randomThree(used);
              }
              out.push(map[fname]);
            }
            break;
          }
          const nstart = i;
          while (i < code.length && isNameChar(code[i])) {
            i = i + 1;
          }
          const name = code.slice(nstart, i);
          if (!name) {
            break;
          }
          if (!(name in map)) {
            map[name] = randomThree(used);
          }
          out.push(map[name]);
          while (i < code.length && code[i] === " ") {
            out.push(code[i]);
            i = i + 1;
          }
          if (i < code.length && code[i] === ",") {
            out.push(",");
            i = i + 1;
            while (i < code.length && code[i] === " ") {
              out.push(code[i]);
              i = i + 1;
            }
            continue;
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
      } else {
        while (i < code.length && code[i] !== String.fromCharCode(10)) {
          i = i + 1;
        }
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
      out = out + "_B91D(" + String.fromCharCode(34) + base91Encode(inner) + String.fromCharCode(34) + ")";
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
      out = out + "_B91D(" + String.fromCharCode(34) + base91Encode(inner) + String.fromCharCode(34) + ")";
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
  const pad = "local _pad = " + q + makePadString(padLen) + q + nl;
  let dummy = "local _dummy = {";
  for (let i = 1; i <= 50; i++) {
    dummy = dummy + " _k" + i + " = " + Math.floor(Math.random() * 100000);
    if (i < 50) {
      dummy = dummy + ",";
    }
  }
  dummy = dummy + " }" + nl;
  let junk = "";
  for (let i = 1; i <= 3; i++) {
    junk = junk + "local _junk" + i + " = function() return " + (100 + i) + " end" + nl;
  }
  return pad + dummy + junk;
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
    lines.push("elseif _LPH == " + (index + 1) + " then");
    lines.push("local _KIND = " + String.fromCharCode(34) + kind + String.fromCharCode(34));
    lines.push(body);
    lines.push("_LPH = " + (index + 2));
  }
  lines.push("end");
  lines.push("end");
  return lines.join(String.fromCharCode(10));
}
const LUAU_RUNTIME = [
  'local _B91C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" .. string.char(39)',
  "local _B91M = {}",
  "for _i = 1, #_B91C do",
  "    _B91M[string.sub(_B91C, _i, _i)] = _i - 1",
  "end",
  "local function _B91D(s)",
  "    local _v = -1",
  "    local _b = 0",
  "    local _n = 0",
  "    local _o = {}",
  "    for _i = 1, #s do",
  "        local _p = _B91M[string.sub(s, _i, _i)]",
  "        if _p then",
  "            if _v < 0 then",
  "                _v = _p",
  "            else",
  "                _v = _v + _p * 91",
  "                _b = _b + _v * (2 ^ _n)",
  "                if (_v % 8192) > 88 then",
  "                    _n = _n + 13",
  "                else",
  "                    _n = _n + 14",
  "                end",
  "                while _n >= 8 do",
  "                    table.insert(_o, string.char(_b % 256))",
  "                    _b = math.floor(_b / 256)",
  "                    _n = _n - 8",
  "                end",
  "                _v = -1",
  "            end",
  "        end",
  "    end",
  "    if _v >= 0 then",
  "        table.insert(_o, string.char((_b + _v * (2 ^ _n)) % 256))",
  "    end",
  "    return table.concat(_o)",
  "end",
  "local _LPH = 1",
  "while true do",
  "    if _LPH == 0 then",
  "        break",
  "    elseif _LPH == 1 then",
  "        _LPH = 2",
  "    elseif _LPH == 2 then",
  "        _LPH = 3",
  "    elseif _LPH == 3 then",
  "        _LPH = 0",
  "    end",
  "end"
].join(String.fromCharCode(10));
const PY_ENGINE = [
  'import random',
  'import string',
  'B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" + chr(39)',
  'B91_MAP = {}',
  'for _i, _c in enumerate(B91_CHARS):',
  '    B91_MAP[_c] = _i',
  'LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"',
  'KEYWORDS = ["and", "break", "do", "else", "elseif", "end", "false", "for", "function", "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while"]',
  'def random_three(used):',
  '    while True:',
  '        name = ""',
  '        for _k in range(3):',
  '            name = name + LETTERS[random.randrange(len(LETTERS))]',
  '        if name not in used and name not in KEYWORDS:',
  '            used.add(name)',
  '            return name',
  'def is_name_char(ch):',
  '    return ch.isalnum() or ch == "_"',
  'def is_name_start(ch):',
  '    return ch.isalpha() or ch == "_"',
  'def base91_encode(data):',
  '    if isinstance(data, str):',
  '        data = data.encode("utf-8")',
  '    b = 0',
  '    n = 0',
  '    out = []',
  '    for byte in data:',
  '        b = b | (byte << n)',
  '        n = n + 8',
  '        if n > 13:',
  '            v = b & 8191',
  '            if v > 88:',
  '                b = b >> 13',
  '                n = n - 13',
  '            else:',
  '                v = b & 16383',
  '                b = b >> 14',
  '                n = n - 14',
  '            out.append(B91_CHARS[v % 91])',
  '            out.append(B91_CHARS[v // 91])',
  '    if n > 0:',
  '        out.append(B91_CHARS[b % 91])',
  '        if n > 7 or b > 90:',
  '            out.append(B91_CHARS[b // 91])',
  '    return "".join(out)',
  'def remove_comments(code):',
  '    result = ""',
  '    i = 0',
  '    while i < len(code):',
  '        if code[i:i + 2] == "--":',
  '            if code[i + 2:i + 4] == "[[":',
  '                j = code.find("]]", i + 4)',
  '                if j < 0:',
  '                    break',
  '                i = j + 2',
  '            else:',
  '                while i < len(code) and code[i] != chr(10):',
  '                    i = i + 1',
  '        elif code[i] == chr(34) or code[i] == chr(39):',
  '            q = code[i]',
  '            result = result + code[i]',
  '            i = i + 1',
  '            while i < len(code):',
  '                result = result + code[i]',
  '                if code[i] == q and code[i - 1] != chr(92):',
  '                    i = i + 1',
  '                    break',
  '                i = i + 1',
  '        elif code[i] == chr(91) and i + 1 < len(code) and code[i + 1] == chr(91):',
  '            j = code.find("]]", i + 2)',
  '            if j < 0:',
  '                result = result + code[i:]',
  '                break',
  '            result = result + code[i:j + 2]',
  '            i = j + 2',
  '        else:',
  '            result = result + code[i]',
  '            i = i + 1',
  '    return result',
  'def rename_vars(code):',
  '    mapping = {}',
  '    used = set()',
  '    out = []',
  '    i = 0',
  '    while i < len(code):',
  '        ch = code[i]',
  '        if ch == chr(34) or ch == chr(39):',
  '            q = ch',
  '            j = i + 1',
  '            while j < len(code):',
  '                if code[j] == q and code[j - 1] != chr(92):',
  '                    break',
  '                j = j + 1',
  '            out.append(code[i:j + 1])',
  '            i = j + 1',
  '        elif ch == chr(91) and i + 1 < len(code) and code[i + 1] == chr(91):',
  '            j = code.find("]]", i + 2)',
  '            if j < 0:',
  '                j = len(code) - 1',
  '            else:',
  '                j = j + 1',
  '            out.append(code[i:j + 1])',
  '            i = j + 1',
  '        elif ch == chr(46) or ch == chr(58):',
  '            out.append(ch)',
  '            i = i + 1',
  '            while i < len(code) and code[i] == " ":',
  '                out.append(code[i])',
  '                i = i + 1',
  '            start = i',
  '            while i < len(code) and is_name_char(code[i]):',
  '                i = i + 1',
  '            out.append(code[start:i])',
  '        elif is_name_start(ch):',
  '            start = i',
  '            while i < len(code) and is_name_char(code[i]):',
  '                i = i + 1',
  '            word = code[start:i]',
  '            if word == "local":',
  '                out.append(word)',
  '                while i < len(code) and code[i] == " ":',
  '                    out.append(code[i])',
  '                    i = i + 1',
  '                while True:',
  '                    if code[i:i + 8] == "function" and (i + 8 >= len(code) or not is_name_char(code[i + 8])):',
  '                        out.append("function")',
  '                        i = i + 8',
  '                        while i < len(code) and code[i] == " ":',
  '                            out.append(code[i])',
  '                            i = i + 1',
  '                        fstart = i',
  '                        while i < len(code) and is_name_char(code[i]):',
  '                            i = i + 1',
  '                        fname = code[fstart:i]',
  '                        if fname:',
  '                            if fname not in mapping:',
  '                                mapping[fname] = random_three(used)',
  '                            out.append(mapping[fname])',
  '                        break',
  '                    nstart = i',
  '                    while i < len(code) and is_name_char(code[i]):',
  '                        i = i + 1',
  '                    name = code[nstart:i]',
  '                    if not name:',
  '                        break',
  '                    if name not in mapping:',
  '                        mapping[name] = random_three(used)',
  '                    out.append(mapping[name])',
  '                    while i < len(code) and code[i] == " ":',
  '                        out.append(code[i])',
  '                        i = i + 1',
  '                    if i < len(code) and code[i] == ",":',
  '                        out.append(",")',
  '                        i = i + 1',
  '                        while i < len(code) and code[i] == " ":',
  '                            out.append(code[i])',
  '                            i = i + 1',
  '                        continue',
  '                    break',
  '            elif word in KEYWORDS:',
  '                out.append(word)',
  '            elif word in mapping:',
  '                out.append(mapping[word])',
  '            else:',
  '                out.append(word)',
  '        else:',
  '            out.append(ch)',
  '            i = i + 1',
  '    return "".join(out)',
  'def encode_strings(code):',
  '    out = ""',
  '    i = 0',
  '    while i < len(code):',
  '        if code[i] == chr(34):',
  '            j = i + 1',
  '            inner = ""',
  '            while j < len(code) and code[j] != chr(34):',
  '                if code[j] == chr(92) and j + 1 < len(code):',
  '                    inner = inner + code[j] + code[j + 1]',
  '                    j = j + 2',
  '                else:',
  '                    inner = inner + code[j]',
  '                    j = j + 1',
  '            out = out + "_B91D(" + chr(34) + base91_encode(inner) + chr(34) + ")"',
  '            i = j + 1',
  '        elif code[i] == chr(39):',
  '            j = i + 1',
  '            inner = ""',
  '            while j < len(code) and code[j] != chr(39):',
  '                if code[j] == chr(92) and j + 1 < len(code):',
  '                    inner = inner + code[j] + code[j + 1]',
  '                    j = j + 2',
  '                else:',
  '                    inner = inner + code[j]',
  '                    j = j + 1',
  '            out = out + "_B91D(" + chr(34) + base91_encode(inner) + chr(34) + ")"',
  '            i = j + 1',
  '        else:',
  '            out = out + code[i]',
  '            i = i + 1',
  '    return out',
  'def make_pad_string(length):',
  '    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"',
  '    s = ""',
  '    for _i in range(length):',
  '        s = s + chars[random.randrange(len(chars))]',
  '    return s',
  'def make_padding():',
  '    q = chr(34)',
  '    nl = chr(10)',
  '    pad_len = 500 + random.randrange(501)',
  '    pad = "local _pad = " + q + make_pad_string(pad_len) + q + nl',
  '    dummy = "local _dummy = {"',
  '    for _i in range(1, 51):',
  '        dummy = dummy + " _k" + str(_i) + " = " + str(random.randrange(100000))',
  '        if _i < 50:',
  '            dummy = dummy + ","',
  '    dummy = dummy + " }" + nl',
  '    junk = ""',
  '    for _i in range(1, 4):',
  '        junk = junk + "local _junk" + str(_i) + " = function() return " + str(100 + _i) + " end" + nl',
  '    return pad + dummy + junk',
  'def build_lph_cff(blocks):',
  '    lines = []',
  '    lines.append("local _LPH = 1")',
  '    lines.append("while true do")',
  '    lines.append("if _LPH == 0 then")',
  '    lines.append("break")',
  '    for index, block in enumerate(blocks):',
  '        kind = block[0]',
  '        body = block[1]',
  '        lines.append("elseif _LPH == " + str(index + 1) + " then")',
  '        lines.append("local _KIND = " + chr(34) + kind + chr(34))',
  '        lines.append(body)',
  '        lines.append("_LPH = " + str(index + 2))',
  '    lines.append("end")',
  '    lines.append("end")',
  '    return chr(10).join(lines)',
  'LUAU_LINES = []',
  'LUAU_LINES.append("local _B91C = " + chr(34) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" + chr(39) + chr(34))',
  'LUAU_LINES.append("local _B91M = {}")',
  'LUAU_LINES.append("for _i = 1, #_B91C do")',
  'LUAU_LINES.append("    _B91M[string.sub(_B91C, _i, _i)] = _i - 1")',
  'LUAU_LINES.append("end")',
  'LUAU_LINES.append("local function _B91D(s)")',
  'LUAU_LINES.append("    local _v = -1")',
  'LUAU_LINES.append("    local _b = 0")',
  'LUAU_LINES.append("    local _n = 0")',
  'LUAU_LINES.append("    local _o = {}")',
  'LUAU_LINES.append("    for _i = 1, #s do")',
  'LUAU_LINES.append("        local _p = _B91M[string.sub(s, _i, _i)]")',
  'LUAU_LINES.append("        if _p then")',
  'LUAU_LINES.append("            if _v < 0 then")',
  'LUAU_LINES.append("                _v = _p")',
  'LUAU_LINES.append("            else")',
  'LUAU_LINES.append("                _v = _v + _p * 91")',
  'LUAU_LINES.append("                _b = _b + _v * (2 ^ _n)")',
  'LUAU_LINES.append("                if (_v % 8192) > 88 then")',
  'LUAU_LINES.append("                    _n = _n + 13")',
  'LUAU_LINES.append("                else")',
  'LUAU_LINES.append("                    _n = _n + 14")',
  'LUAU_LINES.append("                end")',
  'LUAU_LINES.append("                while _n >= 8 do")',
  'LUAU_LINES.append("                    table.insert(_o, string.char(_b % 256))")',
  'LUAU_LINES.append("                    _b = math.floor(_b / 256)")',
  'LUAU_LINES.append("                    _n = _n - 8")',
  'LUAU_LINES.append("                end")',
  'LUAU_LINES.append("                _v = -1")',
  'LUAU_LINES.append("            end")',
  'LUAU_LINES.append("        end")',
  'LUAU_LINES.append("    end")',
  'LUAU_LINES.append("    if _v >= 0 then")',
  'LUAU_LINES.append("        table.insert(_o, string.char((_b + _v * (2 ^ _n)) % 256))")',
  'LUAU_LINES.append("    end")',
  'LUAU_LINES.append("    return table.concat(_o)")',
  'LUAU_LINES.append("end")',
  'LUAU_LINES.append("local _LPH = 1")',
  'LUAU_LINES.append("while true do")',
  'LUAU_LINES.append("    if _LPH == 0 then")',
  'LUAU_LINES.append("        break")',
  'LUAU_LINES.append("    elseif _LPH == 1 then")',
  'LUAU_LINES.append("        _LPH = 2")',
  'LUAU_LINES.append("    elseif _LPH == 2 then")',
  'LUAU_LINES.append("        _LPH = 3")',
  'LUAU_LINES.append("    elseif _LPH == 3 then")',
  'LUAU_LINES.append("        _LPH = 0")',
  'LUAU_LINES.append("    end")',
  'LUAU_LINES.append("end")',
  'LUAU_RUNTIME = chr(10).join(LUAU_LINES)',
  'def obfuscate(code):',
  '    cleaned = remove_comments(code)',
  '    renamed = rename_vars(cleaned)',
  '    encoded = encode_strings(renamed)',
  '    minified = " ".join(encoded.split())',
  '    blocks = [("function", minified), ("do", "do " + minified + " end"), ("for", "for _i = 1, 1 do " + minified + " end")]',
  '    flat = build_lph_cff(blocks)',
  '    head = "local _big = " + chr(34) + make_pad_string(120) + chr(34) + chr(10)',
  '    tail = make_padding()',
  '    return head + flat + chr(10) + chr(10) + LUAU_RUNTIME + chr(10) + tail'
].join(String.fromCharCode(10));
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
  const blocks = [["function", minified], ["do", "do " + minified + " end"], ["for", "for _i = 1, 1 do " + minified + " end"]];
  const flat = cffLPH(blocks);
  const head = "local _big = " + String.fromCharCode(34) + makePadString(120) + String.fromCharCode(34) + String.fromCharCode(10);
  const tail = makePadding();
  return head + flat + String.fromCharCode(10) + String.fromCharCode(10) + LUAU_RUNTIME + String.fromCharCode(10) + tail;
}
function byteLength(text) {
  return new TextEncoder().encode(text).length;
}
function updateStats(original, protectedText) {
  const origEl = document.getElementById("origBytes");
  const protEl = document.getElementById("protBytes");
  const growEl = document.getElementById("growPct");
  const orig = byteLength(original);
  const prot = byteLength(protectedText);
  let pct = 0;
  if (orig > 0) {
    pct = ((prot - orig) / orig) * 100;
  }
  if (origEl) {
    origEl.textContent = String(orig);
  }
  if (protEl) {
    protEl.textContent = String(prot);
  }
  if (growEl) {
    growEl.textContent = String(Math.round(pct * 10) / 10) + "%";
  }
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
    updateStats("", "");
    return;
  }
  const result = await runObfus(raw);
  outputCode.textContent = result;
  updateStats(raw, result);
}
function clearAll() {
  inputCode.value = "";
  outputCode.textContent = "Your protected code will appear here.";
  updateStats("", "");
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