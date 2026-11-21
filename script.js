local _B91C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" .. string.char(39)
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
local function _XOR(data, key)
    local decoded = _B91D(data)
    local res = {}
    for i = 1, #decoded do
        local b = string.byte(decoded, i)
        local k = string.byte(key, ((i - 1) % #key) + 1)
        table.insert(res, string.char(bit32 and bit32.bxor(b, k) or (b ~ k)))
    end
    return table.concat(res)
end
local _big = "Vq4iN7bX2pLm89KzQ1wRtY6fGhJ0dSaDcE3rFlVbCnXmZlAsDkFjGhHgQweRtyUiOp"
local _LPH = 1
while true do
if _LPH == 0 then
break
elseif _LPH == 1 then
do
local dZw = function(v7A, b3K)
return function()
local m9X = _XOR(v7A, b3K)
local l2Q = function(w4H)
print(w4H)
end
l2Q(m9X)
end
end
local z8N = dZw("d67", "c6")
z8N()
end
_LPH = 0
else
_LPH = 0
end
end
local _pad = "9KzQ1wRtY6fGhJ0dSaDcE3rFlVbCnXmZlAsDkFjGhHgQweRtyUiOpVq4iN7bX2pLm89"
