ENGINE_ONLY = "ENGINE ONLY - RUN FROM JS - obfus.py IS THE PROTECTION ENGINE"
__all__ = ["obfuscate", "base91_encode", "base91_decode", "build_lph_cff"]
B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~'"
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


try:
    window.ObfusEngine = {"obfuscate": obfuscate}
except Exception:
    pass


if __name__ == "__main__":
    sample = "local message = " + chr(34) + "hello" + chr(34) + chr(10) + "print(message)"
    print(obfuscate(sample))
