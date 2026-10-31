const hamburger = document.getElementById('hamburger');
const dropdown = document.getElementById('dropdown');
const sections = document.querySelectorAll('.section');

hamburger.addEventListener('click', () => dropdown.classList.toggle('open'));
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('open');
});
function switchTab(name) {
  sections.forEach(s => s.style.display = 'none');
  document.getElementById(name).style.display = 'block';
  dropdown.classList.remove('open');
}
document.querySelectorAll('#dropdown div').forEach(item => {
  item.addEventListener('click', () => switchTab(item.dataset.tab));
});
document.getElementById('openVaultBtn').addEventListener('click', () => switchTab('vault'));

function generateHexId() {
  const chars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 12; i++) hex += chars[Math.floor(Math.random() * 16)];
  return hex;
}

const luaInput = document.getElementById('luaInput');
const vaultCard = document.getElementById('vaultCard');
const vaultIdText = document.getElementById('vaultIdText');
const vaultUrl = document.getElementById('vaultUrl');
const codeBlock = document.getElementById('codeBlock');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyLoadstring');
const runBtn = document.getElementById('runBtn');
const testBtn = document.getElementById('testBtn');
const clearBtn = document.getElementById('clearBtn');
const formatBtn = document.getElementById('formatBtn');
const charCount = document.getElementById('charCount');
const lineCount = document.getElementById('lineCount');
const changeStatus = document.getElementById('changeStatus');
const runStatus = document.getElementById('runStatus');
const runOutput = document.getElementById('runOutput');
const runContent = document.getElementById('runContent');
const runTime = document.getElementById('runTime');
const copyStatus = document.getElementById('copyStatus');

let currentId = '';
let currentUrl = '';
let currentLoadstring = '';
let lastSaved = '';
let originalInput = luaInput.value;

function stripLuaComments(code) {
  return code
    .split('\n')
    .map(l => {
      const t = l.trim();
      if (t.startsWith('--')) return '';
      return l;
    })
    .filter(l => l.trim() !== '')
    .join('\n')
    .trim();
}

function updateCounts() {
  const v = luaInput.value;
  charCount.textContent = v.length + ' chars';
  lineCount.textContent = v.split('\n').length + ' line' + (v.split('\n').length>1?'s':'');
  if (v !== originalInput && v !== lastSaved) {
    changeStatus.textContent = 'MODIFIED • UNSAVED';
    changeStatus.className = 'change modified';
  } else if (v === lastSaved && lastSaved !== '') {
    changeStatus.textContent = 'SAVED • NO CHANGE';
    changeStatus.className = 'change unchanged';
  } else {
    changeStatus.textContent = 'NO CHANGE';
    changeStatus.className = 'change unchanged';
  }
}

luaInput.addEventListener('input', updateCounts);
updateCounts();

clearBtn.addEventListener('click', () => {
  luaInput.value = '';
  updateCounts();
});

formatBtn.addEventListener('click', () => {
  let v = stripLuaComments(luaInput.value);
  v = v.replace(/\s+\n/g, '\n').trim();
  luaInput.value = v;
  updateCounts();
});

function generateVaulth() {
  const raw = luaInput.value;
  const cleaned = stripLuaComments(raw);
  if (!cleaned) {
    runStatus.textContent = 'EMPTY';
    runStatus.className = 'change run error';
    return;
  }
  const hex = generateHexId();
  currentId = `vx_${hex}.lua`;
  currentUrl = `https://luau-pro.vercel.app/api/raw?id=vx_${hex}.lua`;
  vaultIdText.textContent = currentId;
  vaultUrl.textContent = currentUrl;
  currentLoadstring = `loadstring(game:HttpGet("${currentUrl}"))()`;
  codeBlock.textContent = currentLoadstring;
  vaultCard.style.display = 'block';
  lastSaved = raw;
  originalInput = raw;
  localStorage.setItem(currentId, cleaned);
  localStorage.setItem(currentId + '_url', currentUrl);
  localStorage.setItem(currentId + '_raw', raw);
  updateCounts();
  runStatus.textContent = 'GENERATED';
  runStatus.className = 'change run success';
  setTimeout(()=>{runStatus.textContent='IDLE';runStatus.className='change run';},2000);
}

generateBtn.addEventListener('click', generateVaulth);

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(currentLoadstring);
  copyStatus.textContent = 'COPIED';
  copyStatus.classList.add('show');
  copyBtn.textContent = 'COPIED';
  setTimeout(()=>{copyStatus.classList.remove('show');copyBtn.textContent='COPY';},1500);
});

codeBlock.addEventListener('contextmenu', e => { e.preventDefault(); return false; });
codeBlock.addEventListener('selectstart', e => { e.preventDefault(); return false; });

function runVault() {
  const raw = luaInput.value;
  const cleaned = stripLuaComments(raw);
  if (!cleaned) {
    runOutput.style.display='block';
    runContent.textContent='[error] empty lua, no content to run';
    runStatus.textContent='ERROR';
    runStatus.className='change run error';
    return;
  }
  runStatus.textContent='RUNNING';
  runStatus.className='change run running';
  runOutput.style.display='block';
  const start = performance.now();
  try {
    let logs = [];
    const mockPrint = (...args) => logs.push(args.join(' '));
    const fn = new Function('print', cleaned);
    fn(mockPrint);
    const end = performance.now();
    runTime.textContent = `${(end-start).toFixed(1)}ms • ${cleaned.length} bytes • NO COMMENTS`;
    if (logs.length===0) {
      runContent.textContent = '[ok] executed, no print output\n--- cleaned lua (no comments) ---\n' + cleaned;
    } else {
      runContent.textContent = logs.join('\n') + '\n--- cleaned lua ---\n' + cleaned;
    }
    runStatus.textContent='SUCCESS';
    runStatus.className='change run success';
  } catch(err) {
    runContent.textContent='[runtime error]\n'+err.message;
    runStatus.textContent='ERROR';
    runStatus.className='change run error';
  }
}

runBtn.addEventListener('click', runVault);

testBtn.addEventListener('click', () => {
  if (!currentId) { generateVaulth(); }
  runVault();
  window.open(currentUrl, '_blank');
});

switchTab('home');
