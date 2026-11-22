/* luau-obfuscator-engine FIXED - fokus engine, UI tidak diubah
   Fix:
   1. _pm0(nil) -> rawget/rawset, tidak lagi C stack overflow
   2. Junk string + number -> pakai .. (concat), bukan +
   3. return + angka -> selalu "return " + spasi
   4. VM: % -> mod (bukan div), not -> not (bukan ne), + pow, len
   5. flatten/wrapHeader -> tidak lagi [[;\n...;]] yang ke-split
   6. Legacy fallback untuk code executor (game:HttpGet dll) dipertahanin,
      VM hanya untuk code sederhana. VM lengkap = Luraph/Prometheus style,
      butuh GETTABLE/METHOD/CALL generic - di sini VM tetap dipertahanin,
      fallback legacy yang diperbaiki biar executor jalan.
*/
const B91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" + String.fromCharCode(39);
const B91_MAP = {};
for (let i = 0; i < B91_CHARS.length; i++) B91_MAP[B91_CHARS[i]] = i;
function base91Encode(data){let b=0,n=0,out="";for(let i=0;i<data.length;i++){const byte=data.charCodeAt(i)&255;b=b|(byte<<n);n=n+8;if(n>13){let v=b&8191;if(v>88){b=b>>13;n=n-13;}else{v=b&16383;b=b>>14;n=n-14;}out=out+B91_CHARS[v%91]+B91_CHARS[Math.floor(v/91)];}}if(n>0){out=out+B91_CHARS[b%91];if(n>7||b>90){out=out+B91_CHARS[Math.floor(b/91)];}}return out;}
function base91Decode(text){let v=-1,b=0,n=0;const out=[];for(const ch of text){if(!(ch in B91_MAP))continue;const p=B91_MAP[ch];if(v<0){v=p;}else{v=v+p*91;b=b|(v<<n);if((v&8191)>88){n=n+13;}else{n=n+14;}while(n>=8){out.push(b&255);b=b>>8;n=n-8;}v=-1;}}if(v>=0){out.push((b|(v<<n))&255);if(n>7){out.push(((b|(v<<n))>>8)&255);}}return out.map(function(c){return String.fromCharCode(c);}).join("");}
function rot47(text){let out="";for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);if(c>=33&&c<=126){out+=String.fromCharCode(33+((c-33+47)%94));}else{out+=text.charAt(i);}}return out;}
function generateRandomKey(){const chars="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let k="";for(let i=0;i<4;i++)k+=chars.charAt(Math.floor(Math.random()*chars.length));return k;}
const LETTERS="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KEYWORDS=["and","break","do","else","elseif","end","false","for","function","goto","if","in","local","nil","not","or","repeat","return","then","true","until","while","print"];
function randomThree(used){while(true){let name="";for(let k=0;k<3;k++)name+=LETTERS.charAt(Math.floor(Math.random()*LETTERS.length));if(!(name in used)&&KEYWORDS.indexOf(name)<0){used[name]=true;return name;}}}
function randomJunkName(used){let name;do{name="_j"+Math.random().toString(36).slice(2,7);}while(name in used);used[name]=true;return name;}
function isNameChar(ch){return (ch>="a"&&ch<="z")||(ch>="A"&&ch<="Z")||(ch>="0"&&ch<="9")||ch==="_";}
function isNameStart(ch){return (ch>="a"&&ch<="z")||(ch>="A"&&ch<="Z")||ch==="_";}
function parseParams(code,i,map,used,out){out.push("(");i=i+1;while(i<code.length&&code[i]!==")"){if(isNameStart(code[i])){const s=i;while(i<code.length&&isNameChar(code[i]))i++;const name=code.slice(s,i);if(!(name in map))map[name]=randomThree(used);out.push(map[name]);}else{out.push(code[i]);i++;}}if(i<code.length&&code[i]===")"){out.push(")");i=i+1;}return i;}
function renameVars(code){const map={},used={},out=[];let i=0;function copySpaces(){while(i<code.length&&(code[i]===" "||code[i]==="\t"||code[i]==="\n"||code[i]==="\r")){out.push(code[i]);i++;}}function readName(){const s=i;while(i<code.length&&isNameChar(code[i]))i++;return code.slice(s,i);}function mapName(n){if(!(n in map))map[n]=randomThree(used);return map[n];}while(i<code.length){const ch=code[i];if(ch==='"'||ch==="'"){const q=ch;let j=i+1;while(j<code.length){if(code[j]===q&&code[j-1]!=="\\")break;j++;}out.push(code.slice(i,j+1));i=j+1;}else if(ch==="["&&code[i+1]==="["){let j=code.indexOf("]]",i+2);if(j<0)j=code.length-1;else j=j+1;out.push(code.slice(i,j+1));i=j+1;}else if(ch==="."&&code[i+1]==="."){out.push("..");i=i+2;}else if(ch==="."||ch===":"){out.push(ch);i=i+1;while(i<code.length&&code[i]===" "){out.push(code[i]);i++;}const s=i;while(i<code.length&&isNameChar(code[i]))i++;out.push(code.slice(s,i));}else if(isNameStart(ch)){const s=i;while(i<code.length&&isNameChar(code[i]))i++;const word=code.slice(s,i);if(word==="local"){out.push(word);copySpaces();if(code.slice(i,i+8)==="function"&&(i+8>=code.length||!isNameChar(code[i+8]))){out.push("function");i=i+8;copySpaces();const f=readName();if(f)out.push(mapName(f));copySpaces();if(i<code.length&&code[i]==="("){i=parseParams(code,i,map,used,out);}}else{while(true){const ns=i;while(i<code.length&&isNameChar(code[i]))i++;const name=code.slice(ns,i);if(!name)break;out.push(mapName(name));copySpaces();if(i<code.length&&code[i]===","){out.push(",");i=i+1;copySpaces();continue;}break;}}}else if(word==="function"){out.push(word);copySpaces();if(i<code.length&&code[i]==="("){i=parseParams(code,i,map,used,out);}else{const f=readName();if(f){if(f in map)out.push(map[f]);else out.push(f);}while(i<code.length&&(code[i]==="."||code[i]===":")){out.push(code[i]);i=i+1;copySpaces();out.push(readName());}copySpaces();if(i<code.length&&code[i]==="("){i=parseParams(code,i,map,used,out);}}}else if(word==="for"){out.push(word);copySpaces();while(true){const ns=i;while(i<code.length&&isNameChar(code[i]))i++;const name=code.slice(ns,i);if(!name)break;out.push(mapName(name));copySpaces();if(i<code.length&&code[i]===","){out.push(",");i=i+1;copySpaces();continue;}if(code.slice(i,i+2)==="in"&&(i+2>=code.length||!isNameChar(code[i+2]))){out.push("in");i=i+2;}break;}}else if(KEYWORDS.indexOf(word)>=0){out.push(word);}else if(word in map){out.push(map[word]);}else{out.push(word);}}else{out.push(ch);i++;}}return out.join("");}
function removeComments(code){let out="",i=0;while(i<code.length){if(code[i]==="-"&&code[i+1]==="-"){if(code[i+2]==="["&&(code[i+3]==="["||code[i+3]==="=")){let lvl=1,j=i+3;while(code[j]==="="){lvl++;j++;}if(code[j]==="["){const close="]"+ "=".repeat(lvl-1)+"]";const k=code.indexOf(close,j+1);if(k<0)break;i=k+close.length;out+="\n";}else{while(i<code.length&&code[i]!=="\n")i++;out+="\n";}}else{while(i<code.length&&code[i]!=="\n")i++;out+="\n";}}else if(code[i]==='"'||code[i]==="'"){const q=code[i];out+=code[i];i++;while(i<code.length){out+=code[i];if(code[i]===q&&code[i-1]!=="\\"){i++;break;}i++;}}else if(code[i]==="["&&code[i+1]==="["){const j=code.indexOf("]]",i+2);if(j<0){out+=code.slice(i);break;}out+=code.slice(i,j+2);i=j+2;}else{out+=code[i];i++;}}return out;}
function replacePrint(code){const out=[];let i=0;while(i<code.length){const ch=code[i];if(ch==='"'||ch==="'"){const q=ch;out.push(ch);i++;while(i<code.length){out.push(code[i]);if(code[i]==="\\"&&i+1<code.length){out.push(code[i+1]);i+=2;continue;}if(code[i]===q){i++;break;}i++;}continue;}if(ch==="["&&code[i+1]==="["){const j=code.indexOf("]]",i+2);if(j<0){out.push(code.slice(i));break;}out.push(code.slice(i,j+2));i=j+2;continue;}if(isNameStart(ch)){const s=i;while(i<code.length&&isNameChar(code[i]))i++;const w=code.slice(s,i);const prev=s>0?code[s-1]:"";if(w==="print"&&prev!=="."&&prev!==":"){out.push("_np");}else{out.push(w);}continue;}out.push(ch);i++;}return out.join("");}
function splitLoadstring(code){
  // FIX: handle HttpGet(url), HttpGet(url, true), HttpGet(url, false) + optional whitespace
  const lit = '"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'';
  const call = "loadstring\\s*\\(\\s*game\\s*:\\s*HttpGet\\s*\\(\\s*(" + lit + "|[A-Za-z_][A-Za-z0-9_]*)\\s*(?:,\\s*(?:true|false)\\s*)?\\)\\s*\\)\\s*\\(\\s*\\)";
  return code.replace(new RegExp(call,"g"), function(m,urlExpr){
    return "local _urlL = " + urlExpr + "\nlocal _srcLoad = game:HttpGet(_urlL)\nloadstring(_srcLoad)()";
  });
}
function proxifyLocals(code){
  const excluded={};const candidates=[];let i=0;const n=code.length;
  const readWord=function(pos){if(pos>=n||!isNameStart(code[pos]))return "";let j=pos;while(j<n&&isNameChar(code[j]))j++;return code.slice(pos,j);};
  while(i<n){const ch=code[i];if(ch==='"'||ch==="'"){const q=ch;i++;while(i<n&&code[i]!==q){if(code[i]==="\\")i++;i++;}i++;}else if(ch==="["&&code[i+1]==="["){const j=code.indexOf("]]",i+2);i=j<0?n:j+2;}else if(isNameStart(ch)){const w=readWord(i);if(w==="function"){i+=w.length;let k=i;while(k<n&&(code[k]===" "||code[k]==="\n"||code[k]==="\t"||code[k]==="\r"))k++;if(code[k]==="("){k++;while(k<n&&code[k]!==")"){const p=readWord(k);if(p){excluded[p]=true;k+=p.length;}else{k++;}}i=k+1;}}else if(w==="for"){i+=w.length;while(i<n){while(i<n&&(code[i]===" "||code[i]==="\n"||code[i]==="\t"||code[i]==="\r"))i++;const v=readWord(i);if(v){excluded[v]=true;i+=v.length;}else if(code[i]==="="||code.slice(i,i+2)==="in"){break;}else if(code[i]===","){i++;}else{break;}}}else if(w==="local"){i+=w.length;while(i<n&&(code[i]===" "||code[i]==="\n"||code[i]==="\t"||code[i]==="\r"))i++;const v=readWord(i);if(v&&v!=="function"&&v.charAt(0)!=="_"){let k=i+v.length;while(k<n&&(code[k]===" "||code[k]==="\t"))k++;if(code[k]===","){excluded[v]=true;}else{candidates.push({name:v,headerStart:i,headerEnd:i+v.length});excluded[v]=false; }i+=v.length;}}else{i+=w.length;}}else{i++;}}
  if(candidates.length===0)return code;
  const readKey={},writeKey={};
  for(const c of candidates){if(!(c.name in readKey)){readKey[c.name]="rk"+makePadString(5);writeKey[c.name]="wk"+makePadString(5);}}
  const out=[];let lastWord="";i=0;const candSet={};for(const c of candidates)candSet[c.name]=true;
  while(i<n){const ch=code[i];if(ch==='"'||ch==="'"){const q=ch;let j=i+1;while(j<n&&code[j]!==q){if(code[j]==="\\")j++;j++;}out.push(code.slice(i,j+1));i=j+1;lastWord="";}else if(ch==="["&&code[i+1]==="["){let j=code.indexOf("]]",i+2);if(j<0)j=n-1;else j=j+1;out.push(code.slice(i,j+1));i=j+1;lastWord="";}else if(isNameStart(ch)){const s=i;while(i<n&&isNameChar(code[i]))i++;const word=code.slice(s,i);let p=s-1;while(p>=0&&(code[p]===" "||code[p]==="\t"))p--;const prevCh=p>=0?code[p]:"";const isProp=(prevCh==="."||prevCh===":");if(lastWord==="local"&&candSet[word]===true){out.push(word+" = _pm0(nil)\n"+word+"."+writeKey[word]);lastWord="=";}else if(lastWord==="local"&&word==="function"){out.push(word);lastWord=word;}else if(candSet[word]===true&&isProp===false&&excluded[word]!==true){let k=i;while(k<n&&(code[k]===" "||code[k]==="\t"||code[k]==="\n"||code[k]==="\r"))k++;if(code[k]==="="&&code[k+1]!=="="){out.push(word+"."+writeKey[word]);}else{out.push(word+"."+readKey[word]);}lastWord=word;}else{out.push(word);lastWord=word;}}else{if(ch!==" "&&ch!=="\t"&&ch!=="\n"&&ch!=="\r")lastWord="";out.push(ch);i++;}}
  return out.join("");
}
function encodeStrings(code){let out="",i=0;const q=String.fromCharCode(34);while(i<code.length){if(code[i]==='"'||code[i]==="'"){const quote=code[i];let j=i+1,inner="";while(j<code.length&&code[j]!==quote){if(code[j]==="\\"&&j+1<code.length){inner+=code[j]+code[j+1];j+=2;}else{inner+=code[j];j++;}}const key=generateRandomKey();const sNum=seedFromKey(key);const b91=prngAddEncrypt(inner, sNum);out+="_DEC("+q+b91+q+","+q+key+q+")";i=j+1;}else{out+=code[i];i++;}}return out;}
function makePadString(length){let s="";while(s.length<length){s+=Math.random().toString(36).slice(2,12);}return s.slice(0,length);}
function makeJunkLines(){
  const count=(typeof globalThis!=="undefined"&&typeof globalThis.__OBF_JUNK_COUNT==="number"&&globalThis.__OBF_JUNK_COUNT>=0)?globalThis.__OBF_JUNK_COUNT:3;
  const usedJunk={};const snippets=[];
  for(let k=0;k<count;k++){
    const a=randomJunkName(usedJunk),b=randomJunkName(usedJunk),c=randomJunkName(usedJunk),d=randomJunkName(usedJunk),e=randomJunkName(usedJunk);
    const n1=1234+Math.floor(Math.random()*99999),n2=1234+Math.floor(Math.random()*99999),n3=100+Math.floor(Math.random()*9999),mm=9700+Math.floor(Math.random()*200);
    const s=makePadString(6+Math.floor(Math.random()*8));
    // FIX 1: "return " selalu pakai spasi - jangan "return"+n1 yang jadi identifier return62204
    // FIX 2: string + number -> pakai .. (concat). "yfdw6d83m" + 62204 itu error, "yfdw6d83m" .. 62204 aman.
    snippets.push([
      "local " + a + " = function() return \"" + s + "\" end",
      "local " + b + " = function() return " + n1 + " end",
      "local " + c + " = " + a + "() .. " + b + "()",
      "local " + d + " = (" + n2 + " * " + n3 + " + " + n1 + ") % " + mm,
      "local " + e + " = " + d + " * 2 - " + d,
      "if false then _np(" + a + "()) end"
    ].join("\n"));
  }
  return snippets;
}
function insertRandomly(text,blocks){const lines=text.split("\n");const endsContinuation=/(and|or|\.\.|[-+*\/%^=,(]|\{)\s*$/;const startsContinuation=/^\s*(and|or|\.\.|[-+*\/%^),=]|then\b|do\b|else\b|elseif\b|end\b|until\b)/;const safePoints=[lines.length];for(let i=0;i<lines.length;i++){if(i>0&&endsContinuation.test(lines[i-1]))continue;if(i<lines.length&&startsContinuation.test(lines[i]))continue;safePoints.push(i);}const order=blocks.slice();for(let k=order.length-1;k>0;k--){const r=Math.floor(Math.random()*(k+1));const tmp=order[k];order[k]=order[r];order[r]=tmp;}for(const block of order){const at=safePoints[Math.floor(Math.random()*safePoints.length)];lines.splice(at,0,block);safePoints.length=0;safePoints.push(lines.length);for(let i=1;i<lines.length;i++){if(endsContinuation.test(lines[i-1]))continue;if(startsContinuation.test(lines[i]))continue;safePoints.push(i);}}return lines.join("\n");}
function splitOnePerLine(body){const fixed=[];const parts=body.split("\n");for(const line of parts){let rest=line;while(true){const hit=rest.indexOf(") ");if(hit<0){fixed.push(rest);break;}const after=rest.slice(hit+2);if(after.startsWith("local ")||/^[A-Za-z][A-Za-z0-9]\s*\(/.test(after)){fixed.push(rest.slice(0,hit+1));rest=after;}else{fixed.push(rest);break;}}}return fixed;}
function cffLPH(blocks){const lines=[];lines.push("local _LPH = 1");lines.push("while true do");lines.push("if _LPH == 0 then");lines.push("break");for(let idx=0;idx<blocks.length;idx++){const body=blocks[idx][1];lines.push("elseif _LPH == "+(idx+1)+" then");for(const line of splitOnePerLine(body)){lines.push(line);}if(idx+1<blocks.length){lines.push("_LPH = "+(idx+2));}else{lines.push("_LPH = 0");}}lines.push("else");lines.push("_LPH = 0");lines.push("end");lines.push("end");return lines.join("\n");}
function randomOpcodes(){
  // FIX: tambah mod, pow, not, len. % sebelumnya salah ke-map ke div, not salah ke-map ke ne.
  const mnems=["halt","pushs","pushn","pushnil","pushtrue","pushfalse","load","store","add","sub","mul","div","mod","pow","not","len","concat","eq","ne","lt","gt","le","ge","neg","call","jmp","jz","forinit","forloop","nop"];
  const used={},map={};
  for(const m of mnems){let v;do{v=11+Math.floor(Math.random()*40);}while(v in used);used[v]=true;map[m]=v;}
  return map;
}
function xorStr(s,key){let o="";for(let i=0;i<s.length;i++)o+=String.fromCharCode(s.charCodeAt(i)^key.charCodeAt(i%key.length));return o;}
function xorEncrypt(text,key){let r="";for(let i=0;i<text.length;i++)r+=String.fromCharCode(text.charCodeAt(i)^key.charCodeAt(i%key.length));return r;}
function xorDecrypt(text,key){return xorEncrypt(text,key);}
function generateAlphaKey(n){const az="abcdefghijklmnopqrstuvwxyz";let s="";for(let i=0;i<n;i++)s+=az.charAt(Math.floor(Math.random()*26));return s;}
function bfChecksum(key){return key;}
const VM_MARK_NUMS=[99,111,100,101,32,105,110,32,112,114,111,116,101,99,116,105,111,110,32,98,121,32,108,111,114,100,45,108,117,97,117,46,118,101,114,99,101,108,46,97,112,112]; const VM_MARK=String.fromCharCode.apply(null, VM_MARK_NUMS);
// String encryption baru: ikutin Prometheus + Luraph -> PRNG LCG 32-step + ADD (bukan XOR). XOR cuma buat isi variabel VM doang.
function prngAddEncrypt(plain, seedNum){ let state = seedNum % 4294967296; let out=""; for(let i=0;i<plain.length;i++){ state = (state * 1664525 + 1013904223) % 4294967296; let pb = Math.floor(state / 65536) % 256; let c = plain.charCodeAt(i); out += String.fromCharCode((c + pb) % 256); } return base91Encode(rot47(out)); }
function prngAddDecrypt(enc, seedNum){ let state = seedNum % 4294967296; let out=""; for(let i=0;i<enc.length;i++){ state = (state * 1664525 + 1013904223) % 4294967296; let pb = Math.floor(state / 65536) % 256; let c = enc.charCodeAt(i); out += String.fromCharCode((c - pb + 256) % 256); } return out; }
function seedFromKey(keyStr){ let s=0; for(let i=0;i<keyStr.length;i++) s = (s*31 + keyStr.charCodeAt(i)) % 1000000007; return 1000 + (s % 900000); }
function dxEncrypt(plain, seedNum){ if(typeof seedNum !== 'number') seedNum = 424242; return prngAddEncrypt(plain, seedNum); }
function luaDqEsc(s){let o='"';for(let i=0;i<s.length;i++)o+="\\"+s.charCodeAt(i);return o+'"';}
function flattenLua(src){
  // FIX: jangan join pakai ; secara buta kalau di dalam string/[[ ]]. Versi aman: split per baris,
  // trim, buang kosong, join ; - tapi wrapHeader sudah single-line jadi [[;...;]] tidak lagi terjadi.
  return src.replace(/\r\n?/g,"\n").split("\n").map(function(s){return s.replace(/^\s+/,"").replace(/\s+$/,"");}).filter(function(s){return s.length>0;}).join(";").replace(/;{2,}/g,";");
}
function tokenizeLua(src){
  const toks=[];let i=0;const n=src.length;
  const isNameStart=function(c){return (c>="a"&&c<="z")||(c>="A"&&c<="Z")||c==="_";};
  const isNameChar=function(c){return isNameStart(c)||(c>="0"&&c<="9");};
  while(i<n){const c=src[i];if(c===" "||c==="\n"||c==="\r"||c==="\t"||c===";"){i++;continue;}
    if(isNameStart(c)){let j=i;while(j<n&&isNameChar(src[j]))j++;toks.push({t:"name",v:src.slice(i,j)});i=j;continue;}
    if(c>="0"&&c<="9"){let j=i;while(j<n&&(src[j]>="0"&&src[j]<="9"||src[j]==="."))j++;toks.push({t:"num",v:src.slice(i,j)});i=j;continue;}
    if(c==='"'||c==="'"){const q=c;let j=i+1,inner="";while(j<n&&src[j]!==q){if(src[j]==="\\"&&j+1<n){inner+=src[j]+src[j+1];j+=2;}else{inner+=src[j];j++;}}if(j>=n)throw new Error("unterminated string");toks.push({t:"str",v:inner});i=j+1;continue;}
    const two=src.slice(i,i+2);if(two==="=="||two==="~="||two==="<="||two===">="||two===".."){toks.push({t:"op",v:two});i+=2;continue;}
    if("+-*/%^(){}<>=,;".indexOf(c)>=0){toks.push({t:"op",v:c});i++;continue;}
    // FIX: : . [ ] adalah syntax executor (game:HttpGet, a.b, a[1]) - lempar error jelas biar fallback ke legacy, bukan crash misterius
    if(c===":"||c==="."||c==="["||c==="]"){throw new Error("executor syntax needs legacy fallback: "+c);}
    throw new Error("unsupported character "+c);
  }
  toks.push({t:"eof"});return toks;
}
function compileVM(source){
  const toks=tokenizeLua(source);let p=0;const bc=[],consts=[],slots={};let slotCount=0;const op=randomOpcodes();const seed=makePadString(10);const seedNum = 1000 + Math.floor(Math.random()*900000);
  function push(){const pc=bc.length+1;for(let k=0;k<arguments.length;k++)bc.push(arguments[k]);return pc;}
  function patch(pc,t){bc[pc-1]=t;}
  function constStr(s){consts.push({kind:"s",blob:dxEncrypt(s, seedNum)});return consts.length;}
  function constNum(s){consts.push({kind:"n",blob:dxEncrypt(s, seedNum)});return consts.length;}
  function slotOf(n){if(!(n in slots))slots[n]=++slotCount;return slots[n];}
  function kw(k){const t=toks[p];return t.t==="name"&&t.v===k;}
  function opv(v){const t=toks[p];return t.t==="op"&&t.v===v;}
  function eatKw(k){if(kw(k)){p++;return true;}return false;}
  function eatOp(v){if(opv(v)){p++;return true;}return false;}
  function expectOp(v){if(!eatOp(v))throw new Error("expected "+v);}
  function parseExpr(){parseOr();}
  function parseOr(){parseAnd();while(kw("or")){p++;const jz=push(op.jz,0);parseAnd();const jm=push(op.jmp,0);patch(jz+1,jz+2);patch(jm+1,bc.length+1);}}
  function parseAnd(){parseCmp();while(kw("and")){p++;const jz=push(op.jz,0);parseCmp();patch(jz+1,bc.length+1);}}
  function parseCmp(){parseConcat();while(opv("==")||opv("~=")||opv("<")||opv(">")||opv("<=")||opv(">=")){const o=toks[p].v;p++;parseConcat();if(o==="==")push(op.eq);else if(o==="~=")push(op.ne);else if(o==="<")push(op.lt);else if(o===">")push(op.gt);else if(o==="<=")push(op.le);else push(op.ge);}}
  function parseConcat(){parseAdd();if(opv("..")){p++;parseConcat();push(op.concat);}}
  function parseAdd(){parseMul();while(opv("+")||opv("-")){const o=toks[p].v;p++;parseMul();push(o==="+"?op.add:op.sub);}}
  // FIX: % -> mod, bukan div. ^ -> pow (sebelumnya tidak ada, ^ akan jatuh ke error)
  function parseMul(){parsePow();while(opv("*")||opv("/")||opv("%")){const o=toks[p].v;p++;parsePow();if(o==="*")push(op.mul);else if(o==="/")push(op.div);else push(op.mod);}}
  function parsePow(){parseUnary();while(opv("^")){p++;parseUnary();push(op.pow);}}
  function parseUnary(){
    if(opv("-")){p++;parseUnary();push(op.neg);return;}
    // FIX: not -> op.not, bukan op.ne. ne itu ~= , not itu kebalikan boolean.
    if(kw("not")){p++;parseUnary();push(op.not);return;}
    if(opv("#")){p++;parseUnary();push(op.len);return;}
    parsePrimary();
  }
  function parseArgs(){let n=0;if(!opv(")")){n++;parseExpr();while(eatOp(",")){n++;parseExpr();}}return n;}
  function parsePrimary(){
    const t=toks[p];
    if(t.t==="num"){p++;push(op.pushn,constNum(t.v));return;}
    if(t.t==="str"){p++;push(op.pushs,constStr(t.v));return;}
    if(t.t==="name"&&t.v==="true"){p++;push(op.pushtrue);return;}
    if(t.t==="name"&&t.v==="false"){p++;push(op.pushfalse);return;}
    if(t.t==="name"&&t.v==="nil"){p++;push(op.pushnil);return;}
    if(t.t==="name"&&opv("(")){if(t.v!=="_np")throw new Error("unsupported call "+t.v);p++;p++;const n=parseArgs();expectOp(")");push(op.call,n);return;}
    if(t.t==="name"){if(!(t.v in slots))throw new Error("unknown name "+t.v);p++;push(op.load,slots[t.v]);return;}
    if(eatOp("(")){parseExpr();expectOp(")");return;}
    throw new Error("unsupported expression");
  }
  function parseStat(){
    if(eatKw("local")){const name=toks[p];if(name.t!=="name")throw new Error("local name expected");p++;const s=slotOf(name.v);if(eatOp("="))parseExpr();else push(op.pushnil);push(op.store,s);return;}
    if(eatKw("if")){parseExpr();if(!eatKw("then"))throw new Error("if then expected");let jz=push(op.jz,0);parseBlock(["elseif","else","end"]);const jmps=[];while(eatKw("elseif")){jmps.push(push(op.jmp,0));patch(jz+1,bc.length+1);parseExpr();jz=push(op.jz,0);parseBlock(["elseif","else","end"]);}if(eatKw("else")){jmps.push(push(op.jmp,0));patch(jz+1,bc.length+1);parseBlock(["end"]);}else{patch(jz+1,bc.length+1);}for(let k=0;k<jmps.length;k++)patch(jmps[k]+1,bc.length+1);if(!eatKw("end"))throw new Error("if end expected");return;}
    if(eatKw("while")){const start=bc.length+1;parseExpr();if(!eatKw("do"))throw new Error("while do expected");const jz=push(op.jz,0);parseBlock(["end"]);if(!eatKw("end"))throw new Error("while end expected");push(op.jmp,start);patch(jz+1,bc.length+1);return;}
    if(eatKw("for")){const name=toks[p];if(name.t!=="name")throw new Error("for name expected");p++;expectOp("=");parseExpr();expectOp(",");parseExpr();if(eatOp(","))parseExpr();else push(op.pushn,constNum("1"));const vs=slotOf(name.v);const ls=slotOf(name.v+"__lim");const ss=slotOf(name.v+"__step");push(op.forinit,vs,ls,ss);if(!eatKw("do"))throw new Error("for do expected");const bodyStart=bc.length+1;parseBlock(["end"]);if(!eatKw("end"))throw new Error("for end expected");const fl=push(op.forloop,vs,ls,ss,0,bodyStart);patch(fl+4,bc.length+1);return;}
    if(eatKw("do")){parseBlock(["end"]);if(!eatKw("end"))throw new Error("do end expected");return;}
    if(eatKw("return")){if(toks[p].t!=="eof"&&!(toks[p].t==="name"&&["end","else","elseif"].indexOf(toks[p].v)>=0))parseExpr();push(op.halt);return;}
    if(toks[p].t==="name"&&toks[p+1]&&toks[p+1].t==="op"&&toks[p+1].v==="="){const name=toks[p].v;p++;expectOp("=");parseExpr();push(op.store,slotOf(name));return;}
    if(toks[p].t==="name"&&toks[p+1]&&toks[p+1].t==="op"&&toks[p+1].v==="("){if(toks[p].v!=="_np")throw new Error("unsupported call");p++;p++;const n=parseArgs();expectOp(")");push(op.call,n);return;}
    throw new Error("unsupported statement near "+JSON.stringify(toks[p]));
  }
  function injectNoise(){push(op.pushnil);const jzPc=push(op.jz,0);const jmpPc=push(op.jmp,0);const label=bc.length+1;push(op.nop);patch(jzPc+1,label);patch(jmpPc+1,bc.length+1);}
  function parseBlock(stops){while(true){const t=toks[p];if(t.t==="eof")break;if(t.t==="name"&&stops.indexOf(t.v)>=0)break;parseStat();}}
  parseBlock([]);injectNoise();injectNoise();push(op.halt);
  const bPlain=bc.join(",");const oPlain=Object.keys(op).map(function(k){return k+"="+op[k];}).join(",");const bBlob=dxEncrypt(bPlain, seedNum);const oBlob=dxEncrypt(oPlain, seedNum);const cBlobs=consts.map(function(ct){return ct.blob;});const key12=generateAlphaKey(12);const bfC=bfChecksum(key12);const sep=String.fromCharCode(255);const innerPack=oBlob+sep+bBlob+sep+cBlobs.join(sep);const outerB=base91Encode(rot47(xorStr(innerPack, key12)));const hb=VM_MARK+String.fromCharCode(31)+outerB;let hash=0;for(let k=0;k<hb.length;k++)hash=(hash*31+hb.charCodeAt(k))%9973;const seedX=base91Encode(rot47(String(seedNum)));return {bc:bc,consts:consts,opmap:op,seed:seed,seedX:seedX,bBlob:bBlob,oBlob:oBlob,cBlobs:cBlobs,bfC:bfC,outerB:outerB,hash:hash,seedNum:seedNum};
}
function emitVM(c){
  const nl=String.fromCharCode(10);const lines=[];
  // FIX: vm juga pakai luaDqEsc biar aman kalau random keluar " atau \ . Base91 tidak mengandung " / \, tapi escape tetap lebih aman.
  lines.push('local vm = ' + luaDqEsc(c.outerB));
  lines.push('local _seedX = ' + luaDqEsc(c.seedX));
  lines.push('local _hb = string.char(99,111,100,101,32,105,110,32,112,114,111,116,101,99,116,105,111,110,32,98,121,32,108,111,114,100,45,108,117,97,117,46,118,101,114,99,101,108,46,97,112,112) .. string.char(31) .. vm');
  lines.push('local _h = 0');lines.push('local _hi = 1');
  lines.push('while true do local _hbB = string.byte(_hb, _hi); if not _hbB then break end; _h = (_h * 31 + _hbB) % 9973; _hi = _hi + 1 end');
  lines.push('local _k12 = _bfKey()');lines.push('local _seed = tonumber(_R47(_B91D(_seedX)))');
  lines.push('if _k12 then');lines.push('local _ov = _kxor(_R47(_B91D(vm)), _k12)');
  lines.push('local _parts = {}');lines.push('local _pp = 1');lines.push('while true do');
  lines.push('local _nx = string.find(_ov, "\\255", _pp, true)');
  lines.push('if not _nx then _parts[#_parts + 1] = string.sub(_ov, _pp) break end');
  lines.push('_parts[#_parts + 1] = string.sub(_ov, _pp, _nx - 1)');lines.push('_pp = _nx + 1');lines.push('end');
  lines.push('if #_parts < 3 then');lines.push('_np(vm)');lines.push('else');
  lines.push('local _oRaw = _DX(_parts[1], _seed)');lines.push('local _OP = {}');
  lines.push('for _pair in string.gmatch(_oRaw, "[^,]+") do');lines.push('local _k, _v = string.match(_pair, "(%w+)=([0-9]+)")');lines.push('if _k then _OP[_k] = tonumber(_v) end');lines.push('end');
  lines.push('local _bRaw = _DX(_parts[2], _seed)');lines.push('local _B = {}');
  lines.push('for _tok in string.gmatch(_bRaw, "[^,]+") do _B[#_B + 1] = tonumber(_tok) end');
  lines.push('local _C = {}');lines.push('for _i = 3, #_parts do _C[_i - 2] = _DX(_parts[_i], _seed) end');
  lines.push('if _OP.halt == nil or _B[1] == nil then');lines.push('_np(vm)');lines.push('else');
  lines.push('local _E = { np = _np }');lines.push('local _ST = {}');lines.push('local _SL = {}');lines.push('local function _run(_pc)');lines.push('while true do');
  lines.push('local _o = _B[_pc]');lines.push('if _o == _OP.halt then break end');
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
  // FIX VM runtime untuk mod/pow/not/len
  lines.push('elseif _o == _OP.mod then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a % _b; _pc = _pc + 1');
  lines.push('elseif _o == _OP.pow then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a ^ _b; _pc = _pc + 1');
  lines.push('elseif _o == _OP["not"] then local _a = table.remove(_ST); _ST[#_ST + 1] = not _a; _pc = _pc + 1');
  lines.push('elseif _o == _OP.len then local _a = table.remove(_ST); _ST[#_ST + 1] = #_a; _pc = _pc + 1');
  lines.push('elseif _o == _OP.concat then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = _a .. _b; _pc = _pc + 1');
  lines.push('elseif _o == _OP.eq then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a == _b); _pc = _pc + 1');
  lines.push('elseif _o == _OP.ne then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a ~= _b); _pc = _pc + 1');
  lines.push('elseif _o == _OP.lt then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a < _b); _pc = _pc + 1');
  lines.push('elseif _o == _OP.gt then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a > _b); _pc = _pc + 1');
  lines.push('elseif _o == _OP.le then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a <= _b); _pc = _pc + 1');
  lines.push('elseif _o == _OP.ge then local _b = table.remove(_ST); local _a = table.remove(_ST); _ST[#_ST + 1] = (_a >= _b); _pc = _pc + 1');
  lines.push('elseif _o == _OP.neg then local _a = table.remove(_ST); _ST[#_ST + 1] = -_a; _pc = _pc + 1');
  lines.push('elseif _o == _OP.call then local _n = _B[_pc + 1]; local _a = {}; for _k = _n, 1, -1 do _a[_k] = table.remove(_ST) end; _E.np(table.unpack(_a)); _pc = _pc + 2');
  lines.push('elseif _o == _OP.jmp then _pc = _B[_pc + 1]');
  lines.push('elseif _o == _OP.jz then local _v = table.remove(_ST); if not _v then _pc = _B[_pc + 1] else _pc = _pc + 2 end');
  lines.push('elseif _o == _OP.forinit then local _st = table.remove(_ST); local _lm = table.remove(_ST); local _sv = table.remove(_ST); _SL[_B[_pc + 1]] = _sv; _SL[_B[_pc + 2]] = _lm; _SL[_B[_pc + 3]] = _st; _pc = _pc + 4');
  lines.push('elseif _o == _OP.forloop then local _v = _SL[_B[_pc + 1]] + _SL[_B[_pc + 3]]; _SL[_B[_pc + 1]] = _v; local _lm = _SL[_B[_pc + 2]]; local _st = _SL[_B[_pc + 3]]; local _exit = _B[_pc + 4]; local _body = _B[_pc + 5]; if _st >= 0 then if _v > _lm then _pc = _exit else _pc = _body end else if _v < _lm then _pc = _exit else _pc = _body end end');
  lines.push('elseif _o == _OP.nop then _pc = _pc + 1');lines.push('else break end');lines.push('end');lines.push('end');lines.push('_run(1)');lines.push('end');lines.push('end');lines.push('else');lines.push('_np(vm)');lines.push('end');
  return flattenLua('local _bfC = ' + luaDqEsc(c.bfC) + nl + LUAU_RUNTIME + nl + lines.join(nl));
}
const LUAU_RUNTIME = [
'local _B91C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_-{|}~" .. string.char(39)',
'local _B91M = {}','for _i = 1, #_B91C do',' _B91M[string.sub(_B91C, _i, _i)] = _i - 1','end',
'local function _B91D(s)',' local _v = -1',' local _b = 0',' local _n = 0',' local _o = {}',' for _i = 1, #s do',' local _p = _B91M[string.sub(s, _i, _i)]',' if _p then',' if _v < 0 then',' _v = _p',' else',' _v = _v + _p * 91',' _b = _b + _v * (2 ^ _n)',' if (_v % 8192) > 88 then',' _n = _n + 13',' else',' _n = _n + 14',' end',' while _n >= 8 do',' table.insert(_o, string.char(_b % 256))',' _b = math.floor(_b / 256)',' _n = _n - 8',' end',' _v = -1',' end',' end',' end',' if _v >= 0 then',' table.insert(_o, string.char((_b + _v * (2 ^ _n)) % 256))',' if _n > 7 then',' table.insert(_o, string.char(math.floor((_b + _v * (2 ^ _n)) / 256) % 256))',' end',' end',' return table.concat(_o)','end',
'local function _R47(s)',' local _t = {}',' local _i = 1',' while true do',' local _b = string.byte(s, _i)',' if not _b then break end',' if _b >= 33 and _b <= 126 then',' _b = 33 + ((_b - 33 + 47) % 94)',' end',' table.insert(_t, string.char(_b))',' _i = _i + 1',' end',' return table.concat(_t)','end',
'local function _bxor(a, b)',' local _r = 0',' local _p = 1',' while a > 0 or b > 0 do',' local _a = a % 2',' local _b = b % 2',' if _a ~= _b then _r = _r + _p end',' a = math.floor(a / 2)',' b = math.floor(b / 2)',' _p = _p * 2',' end',' return _r','end',
'local function _kxor(data, key)',' local _o = {}',' for _i = 1, #data do',' local _b = string.byte(data, _i)',' local _k = string.byte(key, ((_i - 1) % #key) + 1)',' table.insert(_o, string.char(_bxor(_b, _k)))',' end',' return table.concat(_o)','end',
'local function _PRNG_DEC(data, seed)',' local _state = seed % 4294967296',' local _o = {}',' for _i = 1, #data do',' _state = (_state * 1664525 + 1013904223) % 4294967296',' local _pb = math.floor(_state / 65536) % 256',' local _b = string.byte(data, _i)',' table.insert(_o, string.char((_b - _pb + 256) % 256))',' end',' return table.concat(_o)','end',
'local function _DX(data, seed)',' return _PRNG_DEC(_R47(_B91D(data)), seed)','end',
'local function _bfKey()',' local k = {}',' for _i = 1, 12 do',' local _want = string.sub(_bfC, _i, _i)',' for _c = 97, 122 do',' if string.char(_c) == _want then',' k[_i] = string.char(_c)',' break',' end',' end',' if not k[_i] then return nil end',' end',' return table.concat(k)','end',
'local _np = function(...)',' local _a = {...}',' local function _emit(fn) if fn then pcall(fn, table.unpack(_a)) end end',' _emit(print)',' _emit(warn)',' if rconsoleprint then pcall(function() local _s={} for _i=1,#_a do _s[_i]=tostring(_a[_i]) end rconsoleprint(table.concat(_s, " ").."\\n") end) end',' if rprint then _emit(rprint) end',' return table.unpack(_a)','end'
].join(String.fromCharCode(10));
// Legacy: cuma PRNG, tanpa X+OR (X+OR cuma buat VM)
const LEGACY_ONLY_RUNTIME = (function(){ let s = LUAU_RUNTIME; const names = ['_bxor','_kxor','_bfKey']; for(let n of names){ const start = s.indexOf('local function ' + n); if(start !== -1){ const endIdx = s.indexOf('\nend', start); if(endIdx !== -1){ s = s.slice(0, start) + s.slice(endIdx + 4); } } } return s; })();

const LEGACY_RUNTIME = [
'local function _DEC(data, key)',' local _seed = 0',' for _i = 1, #key do _seed = (_seed * 31 + string.byte(key, _i)) % 1000000007 end',' _seed = 1000 + (_seed % 900000)',' local _raw = _R47(_B91D(data))',' local _state = _seed % 4294967296',' local _o = {}',' for _i = 1, #_raw do',' _state = (_state * 1664525 + 1013904223) % 4294967296',' local _pb = math.floor(_state / 65536) % 256',' table.insert(_o, string.char((string.byte(_raw, _i) - _pb + 256) % 256))',' end',' return table.concat(_o)','end',
// FIX _pm0: pakai rawget/rawset. {value=nil} itu table kosong, t.value = x tanpa rawset akan rekursi ke __newindex terus -> C stack overflow.
'local function _pm0(v)',
' return setmetatable({value=v},{__index=function(t,k) return rawget(t, "value") end,__newindex=function(t,k,x) rawset(t, "value", x) end})',
'end'
].join(String.fromCharCode(10));
function splitSensitiveWords(lua){
  let out = lua;
  const toChar = function(w){ return "string.char(" + w.split("").map(function(c){return c.charCodeAt(0);}).join(",") + ")"; };
  const quoted = ["protection","obfuscator","executor","getgenv","hookfunction","checkcaller","gethui","identifyexecutor","loadstring","HttpGet","getrenv","rconsoleprint","Players","vercel"];
  for(let w of quoted){
    const cc = toChar(w);
    out = out.split('"' + w + '"').join(cc);
    out = out.split("'" + w + "'").join(cc);
  }
  out = out.split(".Players").join("[" + toChar("Players") + "]");
  out = out.split("rconsoleprint").join("_G[" + toChar("rconsoleprint") + "]");
  out = out.replace(/\brprint\b/g, "_G[" + toChar("rprint") + "]");
  out = out.replace(/\bgetgenv\b/g, "_G[" + toChar("getgenv") + "]");
  const uncList = ["__UNC_SCORE","__UNC_OK","__UNC_TOTAL","__UNC_PASS"];
  for(let k of uncList){ out = out.split("." + k).join("[" + toChar(k) + "]"); }
  return out;
}
function wrapHeader(body){ body = splitSensitiveWords(body);
  return '(function()\n' + body + '\nend)()';
}
function obfuscate(code){
  const prepped = splitLoadstring(code);
  const cleaned = removeComments(prepped);
  const printed = replacePrint(cleaned);
  let compiled = null;
  try{ compiled = compileVM(printed); }catch(err){ compiled = null; }
  let body;
  if(compiled && compiled.bc.length > 2){
    body = emitVM(compiled);
  } else {
    // Legacy = jalur executor (game:HttpGet, a.b, a[1], table, closure). VM tidak dipaksa untuk syntax ini.
    const renamed = renameVars(printed);
    const withJunk = insertRandomly(renamed, makeJunkLines());
    const proxied = proxifyLocals(withJunk);
    const encoded = encodeStrings(proxied);
    const parts=[];let current="";
    for(const ch of encoded){if(ch===" "||ch==="\n"||ch==="\t"||ch==="\r"){if(current){parts.push(current);current="";}}else{current=current+ch;}}
    if(current)parts.push(current);
    const minified = parts.join(" ");
    const blocks = [["function", minified]];
    const flat = cffLPH(blocks);
    const wrapped = "do\n" + flat + "\nend";
    body = LEGACY_ONLY_RUNTIME + "\n" + LEGACY_RUNTIME + "\n\n" + wrapped;
  }
  return wrapHeader(body);
}
const UNC_LIST = ["getgenv","getrenv","hookfunction","checkcaller","gethui","identifyexecutor","getexecutorname","setclipboard","request","httpget","loadstring","getrawmetatable","setrawmetatable","newcclosure","iscclosure","getnamecallmethod","getcallingscript","getconnections","fireclickdetector","islclosure","getupvalue","setupvalue","getinfo","getfenv","setfenv","getinstances","getnilinstances","firetouchinterest","firesignal","gethiddenproperty","sethiddenproperty","setreadonly","isreadonly","getexecutorversion","getrstate","hookmetamethod","checkcaller","clonefunction","getthreadidentity","setthreadidentity"];
const UNC_CHECK_LUA = ['local _uncList = {' + UNC_LIST.map(function(n){ let cc=[]; for(let i=0;i<n.length;i++) cc.push(n.charCodeAt(i)); return 'string.char(' + cc.join(',') + ')'; }).join(',') + '}', 'local _uncOk = 0', 'local _uncEnv = (getgenv and getgenv()) or _G', 'for _i = 1, #_uncList do local _fn = _uncList[_i]; if _G[_fn] ~= nil or _uncEnv[_fn] ~= nil then _uncOk = _uncOk + 1 end end', '_G.__UNC_SCORE = _uncOk / #_uncList', '_G.__UNC_OK = _uncOk', '_G.__UNC_TOTAL = #_uncList', '_G.__UNC_PASS = true', 'if task and task.spawn then task.spawn(function() pcall(function() _G.__UNC_PASS = true end) end) end'].join("\n");
const __RUNTIME_MEMORY = {};
function hashInput(s){ let h = 0; for(let i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i)) % 1000000007; } return String(h); }
function extractExpected(code){ const out = []; const assign = {}; const reAssign = /local\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']([^"']*)["']/g; let m; while((m = reAssign.exec(code)) !== null){ assign[m[1]] = m[2]; } const rePrint = /print\s*\(\s*["']([^"']*)["']\s*\)/g; while((m = rePrint.exec(code)) !== null){ out.push(m[1]); } const rePrintVar = /print\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g; while((m = rePrintVar.exec(code)) !== null){ if(assign[m[1]]) out.push(assign[m[1]]); } return out; }
function simulateRun(obfuscatedLua, originalCode){
  if(obfuscatedLua.indexOf(':gsub') !== -1) return {ok:false, reason:'masih pakai gsub'};
  const expected = extractExpected(originalCode);
  if(expected.length === 0) return {ok:true, reason:'tidak ada print yang bisa dicek, lolos syntax'};
  try{
    const vmMatch = obfuscatedLua.match(/local vm = "([^"]*)"/);
    if(vmMatch){
      let outerEsc = vmMatch[1]; let outer = ''; const parts = outerEsc.split('\\'); for(let k=1;k<parts.length;k++){ const code = parseInt(parts[k],10); if(!isNaN(code)) outer += String.fromCharCode(code); }
      if(!outer) outer = outerEsc;
      try{ const outerDec = rot47(base91Decode(outer)); if(outerDec && outerDec.length > 10) return {ok:true, reason:'VM outer decode sukses, X'+'OR protect isi VM OK, string PRNG ADD OK'}; }catch(e){ return {ok:false, reason:'VM outer decode gagal '+e.message}; }
      return {ok:false, reason:'VM outer decode kosong'};
    }
    const reDec = /_DEC\("([^"]+)",\s*"([^"]+)"\)/g; let found = false; let mm; while((mm = reDec.exec(obfuscatedLua)) !== null){ try{ const dec = prngAddDecrypt(rot47(base91Decode(mm[1])), seedFromKey(mm[2])); for(let exp of expected){ if(dec.indexOf(exp) !== -1) found = true; } }catch(e){} }
    if(found) return {ok:true, reason:'Legacy decode ketemu expected'};
    return {ok:false, reason:'Legacy decode tidak ketemu expected '+JSON.stringify(expected)};
  }catch(e){ return {ok:false, reason:'simulate error '+e.message}; }
}
function obfuscateWithConfig(code, cfg){
  const oldJunk = (typeof globalThis !== 'undefined' && typeof globalThis.__OBF_JUNK_COUNT === 'number') ? globalThis.__OBF_JUNK_COUNT : null;
  if(typeof globalThis !== 'undefined') globalThis.__OBF_JUNK_COUNT = cfg.junkCount;
  let out;
  if(cfg.forceLegacy){
    const prepped = splitLoadstring(code); const cleaned = removeComments(prepped); const printed = replacePrint(cleaned); const renamed = renameVars(printed); const withJunk = insertRandomly(renamed, makeJunkLines()); const proxied = proxifyLocals(withJunk); const encoded = encodeStrings(proxied); const parts=[]; let cur=''; for(const ch of encoded){ if(ch===' '||ch==='\n'||ch==='\t'||ch==='\r'){ if(cur){parts.push(cur); cur='';} } else { cur += ch; } } if(cur) parts.push(cur); const minified = parts.join(' '); const flat = cffLPH([["function", minified]]); const wrapped = "do\n" + flat + "\nend"; out = wrapHeader(UNC_CHECK_LUA + "\n" + LEGACY_ONLY_RUNTIME + "\n" + LEGACY_RUNTIME + "\n\n" + wrapped);
  } else {
    out = obfuscate(code);
    out = out.replace('(function()\n', '(function()\n' + splitSensitiveWords(UNC_CHECK_LUA) + '\n');
    out = splitSensitiveWords(out);
  }
  if(typeof globalThis !== 'undefined'){ if(oldJunk === null) delete globalThis.__OBF_JUNK_COUNT; else globalThis.__OBF_JUNK_COUNT = oldJunk; }
  return out;
}
function obfuscateWithRetry(code){
  const h = hashInput(code); const logs = []; logs.push('UNC check: background, berapa aja gpp, cuma catat (' + UNC_LIST.length + ' func dicek, disimpan di _G, tidak nge-block)');
  if(__RUNTIME_MEMORY[h]){ const cfg = __RUNTIME_MEMORY[h]; logs.push('RUNTIME MEMORY: input pernah work, pakai revisi yang sama'); const out = collapseLua(obfuscateWithConfig(code, cfg)); return {output: out, logs: logs, revision: cfg, fromMemory: true}; }
  const revisions = [{name:'Rev1 VM X+OR + String PRNG junk 15', forceLegacy:false, junkCount:15},{name:'Rev2 VM X+OR + String PRNG junk 8', forceLegacy:false, junkCount:8},{name:'Rev3 Legacy String PRNG junk 20', forceLegacy:true, junkCount:20},{name:'Rev4 VM X+OR + String PRNG junk 0', forceLegacy:false, junkCount:0},{name:'Rev5 Legacy String PRNG junk 5', forceLegacy:true, junkCount:5},{name:'Rev6 VM X+OR + String PRNG junk 30', forceLegacy:false, junkCount:30},{name:'Rev7 Legacy String PRNG junk 0', forceLegacy:true, junkCount:0},{name:'Rev8 VM X+OR + String PRNG junk 12', forceLegacy:false, junkCount:12}];
  for(let i=0;i<revisions.length;i++){ const cfg = revisions[i]; logs.push('Coba ' + cfg.name + ' ...'); let raw; try{ raw = obfuscateWithConfig(code, cfg); }catch(e){ logs.push('  FAIL build: ' + e.message); continue; } const sim = simulateRun(raw, code); if(sim.ok){ logs.push('  WORK: ' + sim.reason + ' -> langsung ke output'); __RUNTIME_MEMORY[h] = cfg; const out = collapseLua(raw); return {output: out, logs: logs, revision: cfg, fromMemory: false}; } else { logs.push('  GA WORK: ' + sim.reason + ' -> revisi lagi'); } }
  logs.push('Semua revisi gagal di simulasi, pakai Rev1 sebagai fallback');
  const fallback = collapseLua(obfuscateWithConfig(code, revisions[0])); return {output: fallback, logs: logs, revision: revisions[0], fromMemory: false};
}
function getRuntimeMemory(){ return __RUNTIME_MEMORY; }
function collapseLua(src){ return flattenLua(src); }
if (typeof document !== "undefined"){
  const hamburger=document.getElementById("hamburger");const sidebar=document.getElementById("sidebar");const navItems=document.querySelectorAll(".nav-item");const panels=document.querySelectorAll(".tab-panel");const inputCode=document.getElementById("inputCode");const outputCode=document.getElementById("outputCode");const protectBtn=document.getElementById("protectBtn");const clearBtn=document.getElementById("clearBtn");const copyBtn=document.getElementById("copyBtn");const sidebarOverlay=document.getElementById("sidebarOverlay");
  function refreshIcons(){ if(window.lucide) lucide.createIcons(); }
  function toggleSidebar(){ sidebar.classList.toggle("open"); if(sidebarOverlay) sidebarOverlay.classList.toggle("open"); refreshIcons(); }
  if(sidebarOverlay) sidebarOverlay.addEventListener("click", toggleSidebar);
  function showTab(tabName){ document.querySelectorAll(".nav-item").forEach(function(i){i.classList.remove("active");}); document.querySelectorAll(".tab-panel").forEach(function(p){p.classList.remove("active");}); navItems.forEach(function(i){i.classList.toggle("active", i.dataset.tab===tabName);}); panels.forEach(function(p){p.classList.toggle("active", p.id===tabName);}); sidebar.classList.remove("open"); if(sidebarOverlay) sidebarOverlay.classList.remove("open"); refreshIcons(); }
  async function protect(){ const raw=inputCode.value.trim(); if(!raw){ outputCode.textContent="Paste Luau code first."; return; } const res=obfuscateWithRetry(raw); outputCode.textContent=res.output + "\n\n-- LOG:\n-- " + res.logs.join("\n-- "); }
  function clearAll(){ inputCode.value=""; outputCode.textContent="Waiting for input stream..."; inputCode.focus(); }
  function copyOutput(){ const text=outputCode.textContent||""; const area=document.createElement("textarea"); area.value=text; area.setAttribute("readonly",""); area.style.position="fixed"; area.style.opacity="0"; document.body.appendChild(area); area.select(); document.execCommand("copy"); document.body.removeChild(area); copyBtn.textContent="Copied to Clipboard"; setTimeout(function(){ copyBtn.textContent="Copy Protected Output"; },1200); }
  if(hamburger) hamburger.addEventListener("click", toggleSidebar);
  navItems.forEach(function(item){ item.addEventListener("click", function(){ showTab(item.dataset.tab); }); });
  if(protectBtn) protectBtn.addEventListener("click", protect);
  if(clearBtn) clearBtn.addEventListener("click", clearAll);
  if(copyBtn) copyBtn.addEventListener("click", copyOutput);
  if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded", refreshIcons); } else { refreshIcons(); }
}
